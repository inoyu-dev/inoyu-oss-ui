import { 
  AggregateQuery, 
  DateRange, 
  NumericRange, 
  IpRange,
  AggregationType,
  Condition,
  ConditionTarget 
} from '@/services/shared/types';
import { ConditionBuilder } from './ConditionBuilder';

export class AggregationQueryBuilder {
  private query: AggregateQuery;
  private conditionBuilder: ConditionBuilder;

  constructor(aggregationType : AggregationType, type: ConditionTarget, property: string) {
    this.conditionBuilder = new ConditionBuilder(type);
    this.query = {
      type,
      property,
      aggregationType,
      aggregate: {
        type,
        property,
        parameters: {},
        dateRanges: [],
        numericRanges: [],
        ipRanges: []
      },
      condition: this.conditionBuilder.build()
    };
  }

  public withDateHistogram(interval: string, format?: string) {
    if (this.query.aggregationType !== 'date') {
      throw new Error('Date histogram can only be used with date aggregation type');
    }
    this.query.aggregate.parameters = {
      interval,
      ...(format && { format })
    };
    return this;
  }

  public withDateRanges(ranges: DateRange[]) {
    if (this.query.aggregationType !== 'date') {
      throw new Error('Date ranges can only be used with date aggregation type');
    }
    this.query.aggregate.dateRanges = ranges;
    return this;
  }

  public withNumericRanges(ranges: NumericRange[]) {
    if (this.query.aggregationType !== 'numeric') {
      throw new Error('Numeric ranges can only be used with numeric aggregation type');
    }
    this.query.aggregate.numericRanges = ranges;
    return this;
  }

  public withIpRanges(ranges: IpRange[]) {
    if (this.query.aggregationType !== 'ipRange') {
      throw new Error('IP ranges can only be used with ip aggregation type');
    }
    this.query.aggregate.ipRanges = ranges;
    return this;
  }

  public withCondition(type: string, parameterValues: Record<string, unknown>) {
    this.query.condition = this.conditionBuilder
      .withType(type)
      .withParameters(parameterValues)
      .build();
    return this;
  }

  public withAndCondition(subConditions: Condition[]) {
    this.query.condition = this.conditionBuilder
      .and(subConditions)
      .build();
    return this;
  }

  public withOrCondition(subConditions: Condition[]) {
    this.query.condition = this.conditionBuilder
      .or(subConditions)
      .build();
    return this;
  }

  public withMissingValues(includeMissing: boolean = true) {
    this.query.aggregate.parameters.missing = includeMissing;
    return this;
  }

  public withTerms(size: number = 10, partition?: number, numPartitions?: number) {
    if (this.query.aggregationType !== 'terms') {
      throw new Error('Terms parameters can only be used with terms aggregation type');
    }
    this.query.aggregate.parameters = {
      size,
      ...(partition !== undefined && { partition }),
      ...(numPartitions !== undefined && { numPartitions })
    };
    return this;
  }

  public build(): AggregateQuery {
    return this.query;
  }
}
