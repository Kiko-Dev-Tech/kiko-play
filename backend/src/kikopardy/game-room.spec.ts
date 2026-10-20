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
});
