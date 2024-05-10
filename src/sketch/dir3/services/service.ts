import { Thing, type ThingRepo } from "../domain";

export type ServedThing = {
  foo: number;
} & Thing;

export const service =
  ({ thingRepo }: { thingRepo: Pick<ThingRepo, "findThing"> }) =>
  async (id: string): Promise<ServedThing | null> => {
    const thing = await thingRepo.findThing(id);
    const foo = 123;
    return thing ? { ...thing, foo } : null;
  };

export const service2 = ({
  thingRepo,
}: {
  thingRepo: Pick<ThingRepo, "queryThing">;
}) => {};
