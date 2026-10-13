import { describe, expect, it } from 'vitest';

import { Discipline } from '~common/enums';

import { GLOBAL_CATEGORIES } from './global-categories';

describe('GLOBAL_CATEGORIES', () => {
  it('contains 67 global catalog rows', () => {
    expect(GLOBAL_CATEGORIES).toHaveLength(67);
  });

  it('has unique name + discipline pairs', () => {
    const keys = GLOBAL_CATEGORIES.map((category) => `${category.discipline}:${category.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('covers each discipline group from KATEGORIJE.pdf', () => {
    const byDiscipline = (discipline: Discipline) =>
      GLOBAL_CATEGORIES.filter((category) => category.discipline === discipline).length;

    expect(byDiscipline(Discipline.KATA)).toBe(36);
    expect(byDiscipline(Discipline.KATA_TEAM)).toBe(2);
    expect(byDiscipline(Discipline.YAKO_SOKU_KUMITE)).toBe(1);
    expect(byDiscipline(Discipline.YIJU_KUMITE)).toBe(26);
    expect(byDiscipline(Discipline.KUMITE_TEAM)).toBe(2);
  });

  it('prefixes names with the PDF row number', () => {
    const names = GLOBAL_CATEGORIES.map((category) => category.name);

    expect(names.every((name) => /^\d+\. /.test(name))).toBe(true);
    expect(names.some((name) => name.startsWith('19.'))).toBe(false);
    expect(names).toContain('5. Mlajši Dečki - A');
    expect(names).toContain('5. Mlajši Dečki - B');
    expect(names).toContain('21. Yako-Soku Kumite');
    expect(names).toContain('32. Člani - C');
    expect(names).toContain('34. Starejši Člani');
  });
});
