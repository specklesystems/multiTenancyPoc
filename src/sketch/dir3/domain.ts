export type Thing = {
  id: string;
};

export type ThingRepo = {
  findThing: (id: string) => Promise<Thing | null>;
  queryThing: () => Promise<Thing[]>;
};
