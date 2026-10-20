import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  BoardInput,
  Category,
  Media,
  Question,
  QuestionType,
} from '../../kikopardy/kikopardy.contract.js';

export class MediaDto {
  @IsIn(['youtube', 'image'])
  type: Media['type'];

  @IsUrl({ require_protocol: true })
  url: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  start?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  end?: number;
}

export class QuestionDto implements Question {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsIn(['buzzer', 'guess'])
  type?: QuestionType;

  @IsInt()
  value: number;

  @IsString()
  @MaxLength(2000)
  question: string;

  @IsString()
  @MaxLength(2000)
  answer: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaDto)
  questionMedia?: Media | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaDto)
  answerMedia?: Media | null;
}

export class CategoryDto implements Category {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

export class BoardInputDto implements BoardInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories: CategoryDto[];
}
