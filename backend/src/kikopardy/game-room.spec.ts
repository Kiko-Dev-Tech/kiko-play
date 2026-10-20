import { GameError, GameRoom, type GameSnapshot } from './game-room.js';

function createRoom(overrides: Partial<GameSnapshot> = {}): GameRoom {
  return new GameRoom({
    id: 'game-1',
    code: 'ABCDE',
    status: 'running',
    board: {
      name: 'Test board',
      categories: [
        {
          id: 'c1',
          name: 'Movies',
          questions: [
            { id: 'q1', value: 100, question: 'Q1?', answer: 'A1' },
            { id: 'q2', value: 200, question: 'Q2?', answer: 'A2' },
            {
              id: 'd1',
              value: 400,
              double: true,
              question: 'D?',
              answer: 'DA',
            },
            {
              id: 'g1',
              type: 'guess',
              value: 300,
              question: 'How tall is the Eiffel Tower?',
              answer: '330 m',
            },
          ],
        },
      ],
    },
    players: [],
    playedQuestions: [],
    ...overrides,
  });
}

function scores(room: GameRoom): Record<string, number> {
  return Object.fromEntries(
    room.view(true).players.map((p) => [p.name, p.score]),
  );
}

describe('GameRoom', () => {
  let room: GameRoom;

  beforeEach(() => {
    room = createRoom();
    room.join('p1', 'Anna');
    room.join('p2', 'Ben');
    room.join('p3', 'Cleo');
  });

  it('rejects a name that is already taken by another player', () => {
    expect(() => room.join('p4', 'anna')).toThrow(GameError);
  });

  it('lets a player rejoin with the same id and keeps the score', () => {
    room.setScore('p1', 300);
    room.setConnected('p1', false);
    room.join('p1', 'Anna');
    expect(room.view(false).players.find((p) => p.id === 'p1')).toMatchObject({
      score: 300,
      connected: true,
    });
  });

  it('ignores buzzes until the admin opens the buzzers', () => {
    room.selectQuestion('q1');
    expect(() => room.buzz('p1')).toThrow('Buzzers are locked');
  });

  it('gives the buzzer only to the first player', () => {
    room.selectQuestion('q1');
    room.setBuzzersOpen(true);
    room.buzz('p2');
    expect(() => room.buzz('p1')).toThrow(GameError);
    expect(room.view(false).current?.buzzedPlayerId).toBe('p2');
  });

  it('awards points for a correct answer and closes the question', () => {
    room.selectQuestion('q2');
    room.setBuzzersOpen(true);
    room.buzz('p1');
    room.judge(true);

    expect(scores(room)).toEqual({ Anna: 200, Ben: 0, Cleo: 0 });
    const view = room.view(false);
    expect(view.current?.answerRevealed).toBe(true);
    expect(view.current?.question.answer).toBe('A2');
    expect(view.categories[0].cells[1].played).toBe(true);
  });

  it('deducts points for a wrong answer and reopens buzzers for the others only', () => {
    room.selectQuestion('q1');
    room.setBuzzersOpen(true);
    room.buzz('p1');
    room.judge(false);

    expect(scores(room).Anna).toBe(-100);
    expect(room.view(false).current?.buzzersOpen).toBe(true);
    expect(() => room.buzz('p1')).toThrow('You already answered this question');
    room.buzz('p2');
    expect(room.view(false).current?.buzzedPlayerId).toBe('p2');
  });

  it('lets players who answered wrong buzz again after unlocking', () => {
    room.selectQuestion('q1');
    room.setBuzzersOpen(true);
    room.buzz('p1');
    room.judge(false);
    room.unlockPlayers();
    room.buzz('p1');
    expect(room.view(false).current?.buzzedPlayerId).toBe('p1');
  });

  it('hides the answer from players but not from the admin', () => {
    room.selectQuestion('q1');
    expect(room.view(false).current?.question.answer).toBeUndefined();
    expect(room.view(true).current?.question.answer).toBe('A1');
    room.revealAnswer();
    expect(room.view(false).current?.question.answer).toBe('A1');
  });

  it('shows the question to players only once the buzzers open', () => {
    room.selectQuestion('q1');
    const hidden = room.view(false).current;
    expect(hidden?.questionRevealed).toBe(false);
    expect(hidden?.question.question).toBeUndefined();
    expect(hidden?.question).toMatchObject({
      value: 100,
      categoryName: 'Movies',
    });
    expect(room.view(true).current?.question.question).toBe('Q1?');

    room.setBuzzersOpen(true);
    room.setBuzzersOpen(false);
    expect(room.view(false).current?.question.question).toBe('Q1?');
  });

  it('shows the question when it is skipped before the buzzers opened', () => {
    room.selectQuestion('q1');
    room.skip();
    expect(room.view(false).current?.question.question).toBe('Q1?');
  });

  it('records the results of a question in the played questions', () => {
    room.selectQuestion('q1');
    room.setBuzzersOpen(true);
    room.buzz('p1');
    room.judge(false);
    room.buzz('p2');
    room.judge(true);

    expect(room.snapshot().playedQuestions[0].results).toEqual([
      { playerId: 'p1', correct: false, delta: -100 },
      { playerId: 'p2', correct: true, delta: 100 },
    ]);
  });

  it('marks a question as played when leaving it after a wrong answer', () => {
    room.selectQuestion('q1');
    room.setBuzzersOpen(true);
    room.buzz('p1');
    room.judge(false);
    room.backToBoard();
    expect(room.view(false).categories[0].cells[0].played).toBe(true);
  });

  it('lets the admin mark questions as unplayed again', () => {
    room.selectQuestion('q1');
    room.skip();
    room.setPlayed('q1', false);
    expect(room.view(false).categories[0].cells[0].played).toBe(false);
  });

  it('restores scores and played questions from a snapshot, with everyone disconnected', () => {
    room.setScore('p1', 500);
    room.selectQuestion('q1');
    room.skip();
    const restored = new GameRoom(room.snapshot());
    const view = restored.view(false);
    expect(view.players.find((p) => p.id === 'p1')).toMatchObject({
      score: 500,
      connected: false,
    });
    expect(view.categories[0].cells[0].played).toBe(true);
  });

  it('rejects every action after the game has ended', () => {
    room.end();
    expect(room.isFinished).toBe(true);
    expect(() => room.selectQuestion('q1')).toThrow('This game has ended');
    expect(() => room.join('p9', 'Late')).toThrow('This game has ended');
  });
  describe('guess questions', () => {
    beforeEach(() => room.selectQuestion('g1'));

    it('accepts guesses only while guessing is open', () => {
      expect(() => room.guess('p1', '300 m')).toThrow('Guessing is closed');
      room.setGuessingOpen(true);
      room.guess('p1', '300 m');
      room.guess('p1', ' 320 m ');
      room.setGuessingOpen(false);
      expect(() => room.guess('p2', '1 km')).toThrow('Guessing is closed');
      expect(room.view(true).current?.guesses).toEqual([
        { playerId: 'p1', text: '320 m' },
      ]);
    });

    it('shows the question when guessing opens', () => {
      expect(room.view(false).current?.question.question).toBeUndefined();
      room.setGuessingOpen(true);
      expect(room.view(false).current?.question).toMatchObject({
        type: 'guess',
        question: 'How tall is the Eiffel Tower?',
      });
    });

    it('lets players see only their own guess until the answer is revealed', () => {
      room.setGuessingOpen(true);
      room.guess('p1', '300 m');
      room.guess('p2', '1 km');
      const anna = room.view(false, 'p1').current;
      expect(anna?.guesses).toEqual([{ playerId: 'p1', text: '300 m' }]);
      expect(anna?.guessedPlayerIds).toEqual(['p1', 'p2']);
      expect(room.view(false, 'p3').current?.guesses).toEqual([]);
      expect(room.view(true).current?.guesses).toHaveLength(2);

      room.revealAnswer();
      expect(room.view(false, 'p3').current?.guesses).toHaveLength(2);
      expect(room.view(false).current?.guessingOpen).toBe(false);
    });

    it('withdraws a guess with an empty text', () => {
      room.setGuessingOpen(true);
      room.guess('p1', '300 m');
      room.guess('p1', '   ');
      expect(room.view(true).current?.guessedPlayerIds).toEqual([]);
    });

    it('gives the points to one player and closes the question', () => {
      room.setGuessingOpen(true);
      room.guess('p1', '300 m');
      room.guess('p2', '330 m');
      room.awardGuess('p2');

      expect(scores(room)).toEqual({ Anna: 0, Ben: 300, Cleo: 0 });
      const current = room.view(false).current;
      expect(current?.guessWinnerId).toBe('p2');
      expect(current?.answerRevealed).toBe(true);
      expect(() => room.awardGuess('p1')).toThrow('already been given');
      expect(room.snapshot().playedQuestions[0]).toMatchObject({
        questionId: 'g1',
        results: [{ playerId: 'p2', correct: true, delta: 300 }],
        guesses: [
          { playerId: 'p1', text: '300 m' },
          { playerId: 'p2', text: '330 m' },
        ],
      });
    });

    it('only awards players who guessed', () => {
      room.setGuessingOpen(true);
      expect(() => room.awardGuess('p3')).toThrow('has not guessed');
    });

    it('does not allow buzzing', () => {
      expect(() => room.setBuzzersOpen(true)).toThrow(GameError);
      expect(() => room.buzz('p1')).toThrow(GameError);
    });
  });
  describe('Secret Doubles', () => {
    it('hides the double from players on the board but shows it to the host', () => {
      const playerCell = room
        .view(false)
        .categories[0].cells.find((c) => c.id === 'd1');
      const hostCell = room
        .view(true)
        .categories[0].cells.find((c) => c.id === 'd1');
      expect(playerCell).toEqual({ id: 'd1', value: 400, played: false });
      expect(hostCell?.double).toBe(true);
    });

    it('reveals the double as soon as the question is picked', () => {
      room.selectQuestion('d1');
      expect(room.view(false).current?.question).toMatchObject({
        double: true,
        points: 800,
      });
      expect(room.view(false).current?.question.question).toBeUndefined();
    });

    it('doubles points for right and wrong answers', () => {
      room.selectQuestion('d1');
      room.setBuzzersOpen(true);
      room.buzz('p1');
      room.judge(false);
      room.buzz('p2');
      room.judge(true);
      expect(scores(room)).toEqual({ Anna: -800, Ben: 800, Cleo: 0 });
    });

    it('doubles the points of a guess question', () => {
      const guessRoom = createRoom({
        board: {
          name: 'Guess',
          categories: [
            {
              id: 'c1',
              name: 'Numbers',
              questions: [
                {
                  id: 'g',
                  type: 'guess',
                  double: true,
                  value: 300,
                  question: '?',
                  answer: '!',
                },
              ],
            },
          ],
        },
      });
      guessRoom.join('p1', 'Anna');
      guessRoom.selectQuestion('g');
      guessRoom.setGuessingOpen(true);
      guessRoom.guess('p1', '42');
      guessRoom.awardGuess('p1');
      expect(scores(guessRoom)).toEqual({ Anna: 600 });
    });

    it('counts a normal question once', () => {
      room.selectQuestion('q1');
      expect(room.view(false).current?.question).toMatchObject({
        double: false,
        points: 100,
      });
    });
  });
});
