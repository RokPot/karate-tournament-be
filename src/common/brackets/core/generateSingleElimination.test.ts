import { generateSingleElimination, getSeedOrder, nextPowerOfTwo } from "./generateSingleElimination";
import { getMatchWinnerItem, getSlotItem } from "./types";

type Team = { id: string; name: string };

const teams = (count: number): Team[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `t${index + 1}`,
    name: `Team ${index + 1}`,
  }));

const getId = (team: Team) => team.id;

describe("nextPowerOfTwo", () => {
  it("returns the same value for powers of two", () => {
    expect(nextPowerOfTwo(2)).toBe(2);
    expect(nextPowerOfTwo(8)).toBe(8);
    expect(nextPowerOfTwo(256)).toBe(256);
  });

  it("pads uneven sizes", () => {
    expect(nextPowerOfTwo(3)).toBe(4);
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(9)).toBe(16);
  });
});

describe("getSeedOrder", () => {
  it("pairs 1 vs last in opposite halves", () => {
    expect(getSeedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(getSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe("generateSingleElimination", () => {
  it.each([2, 3, 5, 6, 7, 8, 9, 16])(
    "builds a complete tree for %i participants",
    (count) => {
      const bracket = generateSingleElimination(teams(count), getId);
      const paddedSize = nextPowerOfTwo(count);
      const roundCount = Math.log2(paddedSize);

      expect(bracket.kind).toBe("single_elimination");
      expect(bracket.size).toBe(count);
      expect(bracket.rounds).toHaveLength(roundCount);

      bracket.rounds.forEach((round, roundIndex) => {
        expect(round.matches).toHaveLength(paddedSize / 2 ** (roundIndex + 1));
      });

      const byeCount = bracket.rounds[0].matches.filter(
        (match) => match.data.isBye,
      ).length;
      expect(byeCount).toBe(paddedSize - count);

      bracket.rounds[0].matches
        .filter((match) => match.data.isBye)
        .forEach((match) => {
          expect(match.data.winner).not.toBeNull();
          expect(getMatchWinnerItem(match)).toBeDefined();
        });
    },
  );

  it("pre-fills the next round when a child is a bye", () => {
    const bracket = generateSingleElimination(teams(5), getId);
    const firstRoundByes = bracket.rounds[0].matches.filter(
      (match) => match.data.isBye,
    );
    expect(firstRoundByes.length).toBe(3);

    const secondRound = bracket.rounds[1];
    secondRound.matches.forEach((match) => {
      const childIds = [
        match.item.kind === "tbd" ? match.item.fromMatchId : undefined,
        match.item2.kind === "tbd" ? match.item2.fromMatchId : undefined,
      ].filter(Boolean);

      const byeChildren = firstRoundByes.filter((child) =>
        [match.item, match.item2].some(
          (slot) =>
            slot.kind === "item" &&
            getSlotItem(slot)?.id === getMatchWinnerItem(child)?.id,
        ),
      );

      byeChildren.forEach((child) => {
        expect(childIds.includes(child.id)).toBe(false);
      });
    });

    const unresolvedByeSlots = secondRound.matches.flatMap((match) =>
      [match.item, match.item2].filter((slot) => {
        if (slot.kind !== "tbd") {
          return false;
        }
        const child = bracket.rounds[0].matches.find(
          (roundMatch) => roundMatch.id === slot.fromMatchId,
        );
        return child?.data.isBye;
      }),
    );
    expect(unresolvedByeSlots).toHaveLength(0);
  });

  it("smokes a 128-team bracket", () => {
    const bracket = generateSingleElimination(teams(128), getId);
    expect(bracket.rounds).toHaveLength(7);
    expect(bracket.rounds[0].matches).toHaveLength(64);
    expect(bracket.rounds.at(-1)?.matches).toHaveLength(1);
    expect(
      bracket.rounds[0].matches.filter((match) => match.data.isBye),
    ).toHaveLength(0);
  });

  it("rejects sizes outside 2–256", () => {
    expect(() => generateSingleElimination(teams(1), getId)).toThrow(/at least 2/);
    expect(() => generateSingleElimination(teams(257), getId)).toThrow(
      /at most 256/,
    );
  });

  it.each([2, 3])(
    "omits third place for %i participants even when requested",
    (count) => {
      const bracket = generateSingleElimination(teams(count), getId, {
        includeThirdPlace: true,
      });
      expect(bracket.thirdPlace).toBeUndefined();
    },
  );

  it("omits third place by default", () => {
    const bracket = generateSingleElimination(teams(8), getId);
    expect(bracket.thirdPlace).toBeUndefined();
  });

  it("omits third place when includeThirdPlace is false", () => {
    const bracket = generateSingleElimination(teams(8), getId, {
      includeThirdPlace: false,
    });
    expect(bracket.thirdPlace).toBeUndefined();
  });

  it.each([4, 5, 8])(
    "adds a third-place match for %i participants when requested",
    (count) => {
      const bracket = generateSingleElimination(teams(count), getId, {
        includeThirdPlace: true,
      });
      const semis = bracket.rounds[bracket.rounds.length - 2];
      expect(bracket.thirdPlace).toBeDefined();
      expect(bracket.thirdPlace?.id).toBe("third-place");
      expect(bracket.thirdPlace?.item).toEqual({
        kind: "tbd",
        fromMatchId: semis.matches[0].id,
        outcome: "loser",
      });
      expect(bracket.thirdPlace?.item2).toEqual({
        kind: "tbd",
        fromMatchId: semis.matches[1].id,
        outcome: "loser",
      });
    },
  );

  describe("singleLayerWhenAtMost", () => {
    it.each([2, 3, 4, 5])(
      "generates one round for %i participants",
      (count) => {
        const bracket = generateSingleElimination(teams(count), getId, {
          singleLayerWhenAtMost: 5,
          includeThirdPlace: true,
        });
        expect(bracket.rounds).toHaveLength(1);
        expect(bracket.thirdPlace).toBeUndefined();
        expect(bracket.stop).toEqual({
          fromEnd: Math.log2(nextPowerOfTwo(count)) - 1,
          lastRoundIndex: 0,
        });
      },
    );

    it("pads 5 participants to four first-round matches with three byes", () => {
      const bracket = generateSingleElimination(teams(5), getId, {
        singleLayerWhenAtMost: 5,
      });
      expect(bracket.rounds[0].matches).toHaveLength(4);
      expect(
        bracket.rounds[0].matches.filter((match) => match.data.isBye),
      ).toHaveLength(3);
    });

    it("keeps a larger field as a full tree", () => {
      const bracket = generateSingleElimination(teams(6), getId, {
        singleLayerWhenAtMost: 5,
      });
      expect(bracket.rounds).toHaveLength(3);
      expect(bracket.stop).toBeUndefined();
    });

    it("stays a full tree when the option is not set", () => {
      const bracket = generateSingleElimination(teams(5), getId);
      expect(bracket.rounds).toHaveLength(3);
    });

    it("lets the earlier cutoff win when stopAt applies too", () => {
      const bracket = generateSingleElimination(teams(5), getId, {
        singleLayerWhenAtMost: 5,
        stopAt: { fromEnd: 1 },
      });
      expect(bracket.rounds).toHaveLength(1);
    });

    it("ignores the size rule for a larger field and follows stopAt", () => {
      const bracket = generateSingleElimination(teams(16), getId, {
        singleLayerWhenAtMost: 5,
        stopAt: { fromEnd: 2 },
      });
      expect(bracket.rounds).toHaveLength(2);
    });

    it.each([-1, 2.5, Number.NaN])("rejects %s", (value) => {
      expect(() =>
        generateSingleElimination(teams(4), getId, {
          singleLayerWhenAtMost: value,
        }),
      ).toThrow(/singleLayerWhenAtMost/);
    });
  });

  describe("stopAt", () => {
    it("omits stop on a full tree", () => {
      const bracket = generateSingleElimination(teams(8), getId);
      expect(bracket.stop).toBeUndefined();
    });

    it("keeps the full tree for fromEnd 0", () => {
      const bracket = generateSingleElimination(teams(8), getId, {
        stopAt: { fromEnd: 0 },
      });
      expect(bracket.rounds).toHaveLength(3);
      expect(bracket.stop).toEqual({ fromEnd: 0, lastRoundIndex: 2 });
    });

    it("stops at the quarterfinals for 8 teams with fromEnd 2", () => {
      const bracket = generateSingleElimination(teams(8), getId, {
        stopAt: { fromEnd: 2 },
        includeThirdPlace: true,
      });
      expect(bracket.rounds).toHaveLength(1);
      expect(bracket.rounds[0].matches).toHaveLength(4);
      expect(bracket.thirdPlace).toBeUndefined();
      expect(bracket.stop).toEqual({ fromEnd: 2, lastRoundIndex: 0 });
    });

    it("stops at the second-to-last round with fromEnd 1", () => {
      const bracket = generateSingleElimination(teams(8), getId, {
        stopAt: { fromEnd: 1 },
        includeThirdPlace: true,
      });
      expect(bracket.rounds).toHaveLength(2);
      expect(bracket.rounds.at(-1)?.matches).toHaveLength(2);
      expect(bracket.thirdPlace).toBeUndefined();
      expect(bracket.stop).toEqual({ fromEnd: 1, lastRoundIndex: 1 });
    });

    it("stops at an absolute round", () => {
      const bracket = generateSingleElimination(teams(16), getId, {
        stopAt: { round: 0 },
      });
      expect(bracket.rounds).toHaveLength(1);
      expect(bracket.rounds[0].matches).toHaveLength(8);
      expect(bracket.stop).toEqual({ fromEnd: 3, lastRoundIndex: 0 });
    });

    it("keeps two rounds for 16 teams with fromEnd 2", () => {
      const bracket = generateSingleElimination(teams(16), getId, {
        stopAt: { fromEnd: 2 },
      });
      expect(bracket.rounds.map((round) => round.matches.length)).toEqual([
        8, 4,
      ]);
    });

    it("clamps a fromEnd that would remove every round", () => {
      const bracket = generateSingleElimination(teams(8), getId, {
        stopAt: { fromEnd: 10 },
      });
      expect(bracket.rounds).toHaveLength(1);
      expect(bracket.stop).toEqual({ fromEnd: 2, lastRoundIndex: 0 });
    });

    it("clamps a round past the final to the full tree", () => {
      const bracket = generateSingleElimination(teams(8), getId, {
        stopAt: { round: 9 },
      });
      expect(bracket.rounds).toHaveLength(3);
      expect(bracket.stop).toEqual({ fromEnd: 0, lastRoundIndex: 2 });
    });

    it("keeps third place when the final is kept", () => {
      const bracket = generateSingleElimination(teams(8), getId, {
        stopAt: { fromEnd: 0 },
        includeThirdPlace: true,
      });
      expect(bracket.thirdPlace).toBeDefined();
    });

    it.each([-1, 1.5, Number.NaN])("rejects fromEnd %s", (value) => {
      expect(() =>
        generateSingleElimination(teams(8), getId, {
          stopAt: { fromEnd: value },
        }),
      ).toThrow(/non-negative integer/);
    });

    it.each([-1, 0.5])("rejects round %s", (value) => {
      expect(() =>
        generateSingleElimination(teams(8), getId, {
          stopAt: { round: value },
        }),
      ).toThrow(/non-negative integer/);
    });
  });
});
