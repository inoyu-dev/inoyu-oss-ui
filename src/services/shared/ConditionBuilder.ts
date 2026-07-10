import { Condition, ConditionTarget, CONDITION_TARGET_MAP, ComparisonOperator } from '@/services/shared/types';

export class ConditionBuilder {
  private condition: Condition;
  private target: ConditionTarget;

  constructor(target: ConditionTarget = ConditionTarget.ALL) {
    this.target = target;
    this.condition = {
      type: 'matchAllCondition',
      parameterValues: {}
    };
  }

  private validateConditionType(type: string) {
    const allowedTargets = CONDITION_TARGET_MAP[type] || [];
    if (!allowedTargets.includes(this.target) && !allowedTargets.includes(ConditionTarget.ALL)) {
      throw new Error(`Condition type '${type}' cannot be used with target '${this.target}'`);
    }
  }

  public withType(type: string): this {
    this.validateConditionType(type);
    this.condition.type = type;
    return this;
  }

  public withParameters(parameters: Record<string, unknown>): this {
    this.condition.parameterValues = parameters;
    return this;
  }

  public matchProfile(propertyName: string, propertyValue: unknown, comparisonOperator: ComparisonOperator = 'equals'): this {
    this.validateConditionType('profilePropertyCondition');
    this.condition = {
      type: 'profilePropertyCondition',
      parameterValues: {
        propertyName,
        propertyValue,
        comparisonOperator
      }
    };
    return this;
  }

  public matchSession(propertyName: string, propertyValue: unknown, comparisonOperator: ComparisonOperator = 'equals'): this {
    this.validateConditionType('sessionPropertyCondition');
    this.condition = {
      type: 'sessionPropertyCondition',
      parameterValues: {
        propertyName,
        propertyValue,
        comparisonOperator
      }
    };
    return this;
  }

  public matchEvent(propertyName: string, propertyValue: unknown, comparisonOperator: ComparisonOperator = 'equals'): this {
    this.validateConditionType('eventPropertyCondition');
    this.condition = {
      type: 'eventPropertyCondition',
      parameterValues: {
        propertyName,
        propertyValue,
        comparisonOperator
      }
    };
    return this;
  }

  public pastEvent(eventType: string, timeStamp?: string): this {
    this.validateConditionType('pastEventCondition');
    this.condition = {
      type: 'pastEventCondition',
      parameterValues: {
        eventType,
        ...(timeStamp && { timeStamp })
      }
    };
    return this;
  }

  public and(subConditions: Condition[]): this {
    this.validateConditionType('booleanCondition');
    this.condition = {
      type: 'booleanCondition',
      parameterValues: {
        operator: 'and',
        subConditions
      }
    };
    return this;
  }

  public or(subConditions: Condition[]): this {
    this.validateConditionType('booleanCondition');
    this.condition = {
      type: 'booleanCondition',
      parameterValues: {
        operator: 'or',
        subConditions
      }
    };
    return this;
  }

  public not(subCondition: Condition): this {
    this.validateConditionType('notCondition');
    this.condition = {
      type: 'notCondition',
      parameterValues: {
        subCondition
      }
    };
    return this;
  }

  public matchSegment(segments: string[], matchType: 'all' | 'any' = 'all'): this {
    this.validateConditionType('profileSegmentCondition');
    this.condition = {
      type: 'profileSegmentCondition',
      parameterValues: {
        segments,
        matchType
      }
    };
    return this;
  }

  public matchGoal(goalId: string, minimumCount?: number, maximumCount?: number): this {
    this.validateConditionType('goalMatchCondition');
    this.condition = {
      type: 'goalMatchCondition',
      parameterValues: {
        goalId,
        ...(minimumCount !== undefined && { minimumCount }),
        ...(maximumCount !== undefined && { maximumCount })
      }
    };
    return this;
  }

  public geoLocation(country: string, city?: string): this {
    this.validateConditionType('geoLocationSessionCondition');
    this.condition = {
      type: 'geoLocationSessionCondition',
      parameterValues: {
        country,
        ...(city && { city })
      }
    };
    return this;
  }

  public sessionDuration(minimumDuration: number, maximumDuration?: number): this {
    this.validateConditionType('sessionDurationCondition');
    this.condition = {
      type: 'sessionDurationCondition',
      parameterValues: {
        minimumDuration,
        ...(maximumDuration && { maximumDuration })
      }
    };
    return this;
  }

  public build(): Condition {
    return this.condition;
  }
}
