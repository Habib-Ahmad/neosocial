import neo4j from "neo4j-driver";

export const toNumber = (val: any) => {
  if (neo4j.isInt(val)) return val.toNumber();
  if (val?.low !== undefined) return val.low;
  return val;
};

export const timestampToDate = (t: any): Date =>
  new Date(
    Date.UTC(
      toNumber(t.year),
      toNumber(t.month) - 1,
      toNumber(t.day),
      toNumber(t.hour),
      toNumber(t.minute),
      toNumber(t.second)
    )
  );
