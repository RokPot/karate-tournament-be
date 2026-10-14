import { describe, expect, it } from 'vitest';

import { Discipline, SubDiscipline } from '~common/enums';

import { GLOBAL_CATEGORIES } from './global-categories';

describe('GLOBAL_CATEGORIES', () => {
  it('contains 112 global catalog rows', () => {
    expect(GLOBAL_CATEGORIES).toHaveLength(112);
  });

  it('has unique name + discipline pairs', () => {
    const keys = GLOBAL_CATEGORIES.map((category) => `${category.discipline}:${category.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('covers each discipline group from KATEGORIJE-2.pdf', () => {
    const byDiscipline = (discipline: Discipline) =>
      GLOBAL_CATEGORIES.filter((category) => category.discipline === discipline).length;

    expect(byDiscipline(Discipline.KATA)).toBe(60);
    expect(byDiscipline(Discipline.KATA_TEAM)).toBe(6);
    expect(byDiscipline(Discipline.YIJU_KUMITE)).toBe(25);
    expect(byDiscipline(Discipline.YAKO_SOKU_KUMITE)).toBe(21);
    expect(byDiscipline(Discipline.KUMITE_TEAM)).toBe(0);
  });

  it('prefixes names with the PDF row number and skips Para Karate', () => {
    const names = GLOBAL_CATEGORIES.map((category) => category.name);

    expect(names.every((name) => /^\d+\. /.test(name))).toBe(true);
    expect(names.some((name) => name.startsWith('17.'))).toBe(false);
    expect(names).toContain('1. Mlajši Malčki - C');
    expect(names).toContain('5. Mlajši Dečki - D');
    expect(names).toContain('20. Mlajši Dečki - C');
    expect(names).toContain('30. Malčki/Malčice');
    expect(names).toContain('36. Malčki/Malčice');
  });

  it('sets yako-soku subdisciplines', () => {
    const yako = GLOBAL_CATEGORIES.filter((category) => category.discipline === Discipline.YAKO_SOKU_KUMITE);
    expect(yako.every((category) => category.subDiscipline != null)).toBe(true);
    expect(yako.filter((category) => category.subDiscipline === SubDiscipline.GOHON_IPPON_KUMITE)).toHaveLength(6);
    expect(yako.filter((category) => category.subDiscipline === SubDiscipline.SANBON_IPPON_KUMITE)).toHaveLength(5);
    expect(yako.filter((category) => category.subDiscipline === SubDiscipline.KIHON_IPPON_KUMITE)).toHaveLength(5);
    expect(yako.filter((category) => category.subDiscipline === SubDiscipline.DYU_IPPON_KUMITE)).toHaveLength(5);
  });
});
