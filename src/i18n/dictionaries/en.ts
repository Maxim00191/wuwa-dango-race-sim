import type { TranslationDictionary } from "@/i18n/types";

export const enDictionary: TranslationDictionary = {
  meta: {
    title: "Wuthering Waves 2nd Anniversary: Dango Dash",
  },
  locale: {
    en: "English",
    "zh-CN": "简体中文",
  },
  characters: {
    bot1: "Basic Dango",
    mornye: "Mornye",
    aemeath: "Aemeath",
    lynae: "Lynae",
    carlotta: "Carlotta",
    chisa: "Chisa",
    shorekeeper: "Shorekeeper",
    luukHerssen: "Luuk Herssen",
    sigrika: "Sigrika",
    denia: "Denia",
    hiyuki: "Hiyuki",
    phoebe: "Phoebe",
    cartethyia: "Cartethyia",
    abby: "Abby",
  },
  attributes: {
    fusion: "Fusion",
    glacio: "Glacio",
    aero: "Aero",
    electro: "Electro",
    spectro: "Spectro",
    havoc: "Havoc",
  },
  common: {
    directions: {
      clockwise: "clockwise",
      counterClockwise: "counter-clockwise",
    },
    placements: {
      "0": "1st",
      "1": "2nd",
      "2": "3rd",
      "3": "4th",
      "4": "5th",
      "5": "6th",
    },
    cells: {
      label: "Cell {cell}",
    },
    actions: {
      drag: "Drag",
    },
    notes: {
      one: "{count} record",
      other: "{count} records",
    },
  },
  nav: {
    brand: "Solaris 2nd Anniversary Dango Dash",
    tagline: "Festival Sprints, Resonator Cups, and Tactical Divinations",
    views: {
      normal: "Dash Grounds",
      tournament: "Tournament Hub",
      analysis: "Festival Archives",
    },
    playback: {
      label: "Playback Speed",
      optionAria: "Set playback speed to {speed}x",
    },
    language: {
      label: "Language",
    },
  },
  theme: {
    switchToLightAria: "Switch to daylight theme",
    switchToDarkAria: "Switch to night theme",
    lightTitle: "Daylight theme",
    darkTitle: "Night theme",
  },
  normal: {
    session: {
      idle: "Awaiting the 2nd Anniversary sprint",
      fallback: "Anniversary Sprint",
    },
    monteCarlo: {
      heading: "Match Divinations",
      title: "Simulate the current 2nd Anniversary lineup",
      description:
        "Run fast-paced calculations on the chosen six-dango lineup to see who has the best odds of taking the crown.",
      scenario: {
        label: "Solaris Sprint",
        description: "Every run starts from the default stacked formation.",
        analysisLabel: "Anniversary Sprint Divination",
      },
      lineupIncomplete:
        "Gather all {count} dangos before starting the divination.",
    },
    shell: {
      eyebrow: "Anniversary Grounds",
      title: "Solaris Sprint",
      description:
        "Hop, stack, and utilize track devices to dominate the single-match celebration circuit.",
      start: "Commence the Sprint",
    },
  },
  tournament: {
    session: {
      setup: "Cup Seeding Room",
      finalsReady: "Finals Ready",
      raceFallback: "Celebration Cup",
      preliminaryComplete: "Preliminary Results Recorded",
      finalComplete: "Grand Final Results Recorded",
    },
    monteCarlo: {
      heading: "Bracket Divinations",
      title: "Simulate the full cup or jump straight to the finals",
      description:
        "Stress-test both rounds to see how momentum carries, or calculate win rates based strictly on the current finals lineup.",
      scenarios: {
        tournament: {
          label: "Full Celebration Cup",
          description:
            "Run the preliminary, use the results to seed the final, and crown the ultimate champion.",
          analysisLabel: "Cup Divination",
        },
        final: {
          label: "Current Grand Final Lineup",
          description:
            "Skip the prelims and simulate win rates for the current finals arrangement.",
          officialAnalysisLabel: "Grand Final Divination",
          customAnalysisLabel: "Custom Final Divination",
        },
      },
    },
    shell: {
      eyebrow: "Tournament Center",
      title: "Solaris Celebration Cup",
      description:
        "Complete a preliminary round to determine final seeding, or manually arrange a custom dream match.",
    },
    setup: {
      preliminary: {
        eyebrow: "Round 1",
        title: "Preliminary Sprint",
        description:
          "All competitors start at the line. Placements here will grant seeding advantages in the Grand Final.",
        start: "Begin Preliminary",
        reset: "Reset Cup Progress",
        lockedTitle: "Preliminary Standings Locked",
        empty:
          "Finish the prelims to auto-generate the finals bracket, or drag the badges on the right to set up a custom match.",
      },
      finals: {
        eyebrow: "Round 2",
        title: "Grand Final Lineup",
        description:
          "Proceed with the preliminary seedings, or drag the badges to create a custom showdown.",
        helper:
          "Drag a badge to rearrange the order. You can also use the up and down arrow keys while a badge is selected.",
        ariaLabel: "Grand Final Standings",
        placementAria: "Placement {placement}, {name}",
        start: "Launch Grand Final",
        restore: "Restore Preliminary Seeding",
        roles: {
          startLine: "Starting Lantern",
          topOfStack: "Top of the stack",
          bottomOfStack: "Bottom of the stack",
        },
      },
    },
  },
  lineup: {
    heading: "Starting Roster",
    title: "Invite {count} dangos to the track",
    description:
      "Click a badge to invite them. Once the race heats up, Boss Abby will crash the party.",
    statusReady: "{selected} / {total} ready to go",
    statusOpen: "{selected} / {total} ready · {remaining} {spots} left",
    spotsOne: "slot",
    spotsOther: "slots",
    clear: "Clear selections",
    selected: "Selected",
    available: "Available",
    locked: "Full",
    attributeEmpty: "No dangos yet",
  },
  monteCarlo: {
    runBatch: "Run {count} times",
    useCustomNumber: "Use custom number",
    customRunsLabel: "Custom runs",
    customRunsUnit: "runs",
    customRunsPlaceholder: "5000",
    customRunsHint: "Enter any positive whole number.",
    customRunsInvalid: "Use a positive whole number.",
    stop: "Stop simulation",
    stopping: "Stopping...",
    progress: "Progress",
    standingBy: "Standing by",
    lineupIncomplete:
      "Gather all {count} dangos before starting the divination.",
  },
  game: {
    controls: {
      watch: "Spectate Mode",
      step: "Advance 1 Step",
      playTurn: "Play Turn",
      playingTurn: "Playing...",
      pauseAuto: "Pause Auto-play",
      autoRun: "Enable Auto-play",
      reset: "Reset Track",
      quickRuns: "Quick Resolve",
      instantTurn: "Instantly resolve turn",
      instantGame: "Instantly finish race",
    },
    board: {
      panelTitle: "Live Track Broadcast",
      turnLabel: "Turn {turn}",
      winnerBadge: "Champion!",
      legend: {
        finishLine: {
          label: "Finish Lantern",
          description:
            "Victory requires exactly 32 steps completed, regardless of how close to the line you started.",
        },
        propulsion: {
          label: "Propulsion Device",
          description:
            "Landing here pushes the entire stack on that tile 1 tile clockwise.",
        },
        hindrance: {
          label: "Hindrance Device",
          description:
            "Landing here pushes the entire stack on that tile 1 tile counter-clockwise.",
        },
        rift: {
          label: "Time Rift",
          description:
            "Landing here shuffles the stack on that tile, while Abby always stays at the absolute bottom.",
        },
        stacks: {
          label: "Stacking Mechanics",
          description:
            "Dangos landing on the same tile will stack up neatly, catching a free ride with whoever is at the bottom.",
        },
      },
      ariaLabel: "A 32-tile circular celebration track",
    },
    queue: {
      title: "Action Queue",
    },
    racers: {
      title: "Competitors",
      bossRole: "Boss Status · Larger dice · Moves counter-clockwise",
      basicRole: "Standard Status · Normal dice · Moves clockwise",
      dice: "Rolled a {value}",
    },
    diary: {
      title: "Race Logs",
      empty: "Once the race begins, all the key moments will be logged here.",
    },
  },
  analysis: {
    empty: {
      eyebrow: "Archives",
      title: "No Data Available",
      description:
        "Run a few simulations first. Detailed analytics and performance metrics will populate here afterward.",
      button: "Back to Track",
    },
    header: {
      eyebrow: "Data Analytics",
      description:
        "Generated from {runs} simulations of the current roster. Includes placement spreads, conditional win scenarios, and tournament flow.",
      back: "Return to Simulation",
    },
    tabs: {
      overview: "Overview",
      conditional: "If They Win...",
      tournament: "Bracket Flow",
    },
    metrics: {
      averageTournamentLength: "Avg Cup Length",
      averageRaceLength: "Avg Sprint Length",
      averageTournamentLengthHint: "Total turns across prelims and finals",
      averageRaceLengthHint: "Average turns needed to finish a single race",
      fastestFinish: "Speedrun Record",
      fastestFinishHint: "The shortest match in this batch of simulations",
      titleShare: "Highest Win Rate",
      titleShareHint: "{name} took home the most trophies",
      noWinnerData: "No champion data yet",
      bottomHalfComeback: "Underdog Comebacks",
      bestStability: "Most Consistent",
      bottomHalfComebackHint: "Win rate for dangos who placed 4th-6th in prelims",
      stabilityHint: "{name} had the least placement variance",
      noStabilityData: "No consistency data yet",
    },
    overview: {
      winRateEyebrow: "Win Rate Overview",
      winRateTitleTournament: "Who dominates the Solaris Celebration Cup?",
      winRateTitleRace: "Who claims the Anniversary Sprint the most?",
      finalOnly: "Final placements only",
      averageFinish: "Avg placement: {value}",
      stabilityLensEyebrow: "Consistency Check",
      stabilityLensTitle: "How reliable is each competitor?",
      stabilityLensDescription:
        "High consistency means predictable placements. Low consistency means wild swings between 1st place and dead last.",
      mostStable: "Rock Solid",
      mostVolatile: "Wildcard",
      averageFinishShort: "Avg Finish",
      standardDeviation: "Std Dev",
      boomOrBust: "Feast or Famine",
      distributionEyebrow: "Placement Distribution",
      distributionTitle: "The complete 1st-to-6th breakdown",
      distributionHint:
        "Colors map from 1st place (left) to 6th place (right)",
      stabilityScore: "Consistency {value}",
      winRate: "Win Rate",
      podiumRate: "Top 3 Rate",
      bottomTwoRate: "Bottom 2 Rate",
    },
    conditional: {
      eyebrow: "Scenario Analytics",
      title: "If this dango wins, where does everyone else end up?",
      description:
        "Pick a champion to filter the simulations. See who usually rides their coattails to 2nd place, and who gets left in the dust.",
      tableDango: "Competitor",
      averageFinish: "Avg placement: {value}",
      runs: "{count} matches",
      scenarioSlice: "Specific Scenario",
      matchingRuns: "{count} matching games",
      matchingRunsHint:
        "This dango secured 1st place in {rate} of all simulations.",
      likelyRunnerUp: "Most Likely Runner-up",
      likelyLast: "Most Likely Dead Last",
      secondPlaceChance: "{rate} chance of getting 2nd",
      sixthPlaceChance: "{rate} chance of getting 6th",
      noMatchingRuns: "No data matches this scenario.",
    },
    tournament: {
      eyebrow: "Bracket Analytics",
      title: "Seeding Momentum & Underdog Upsets",
      description:
        "See how preliminary performance translates to final victory. Find out who chokes under pressure and who thrives from behind.",
      topSeedConverts: "Top Seed Conversion",
      topSeedConvertsHint:
        "How often the 1st place prelim winner also wins the Grand Final",
      bottomHalfComeback: "Underdog Comeback",
      bottomHalfComebackHint:
        "How often the 4th, 5th, or 6th place prelim seed wins the Grand Final",
      bestFrontrunner: "Best Frontrunner",
      bestRecoveryArtist: "Comeback King",
      topSeedHint: "{rate} win rate if seeded 1st in prelims",
      underdogHint: "{rate} win rate if seeded 4th-6th in prelims",
      noTopSeedData: "Not enough top-seed data yet",
      noUnderdogData: "Not enough comeback data yet",
      conversionEyebrow: "Individual Conversion Rates",
      conversionTitle: "Early Leads vs Comeback Potential",
      titles: "Won {count} times",
      ifFirstInPrelims: "If 1st in Prelims",
      ifFourthToSixthInPrelims: "If 4th-6th in Prelims",
      matchingPrelimRuns: "{count} prelim matches",
      underdogEntries: "{count} underdog scenarios",
      transitionEyebrow: "Placement Heatmap",
      totalTitles: "{count} total wins",
      transitionDescription:
        "Rows represent Preliminary rank, columns represent Final rank. Read horizontally to see how early seeding predicts the final outcome.",
      prelimHeader: "Prelim Rank",
    },
  },
  simulation: {
    labels: {
      normalRace: "Anniversary Sprint",
      tournamentPreliminary: "Cup Prelims",
      tournamentFinal: "Grand Final",
      customFinal: "Custom Finals",
      finalsReady: "Finals Ready",
      tournamentSetup: "Cup Seeding Room",
    },
    log: {
      abbyResetScheduled:
        "{actor} fell too far behind and will be warped back to the starting line next turn.",
      abbyTeleport:
        "{actor} flashes back to the start lantern, charging up for another run.",
      standby:
        "{actor} is still warming up on the sidelines. The boss will drop in once the pace picks up.",
      roll: "{actor} rolled a {value}.",
      skipNotBottom:
        "{actor} is piggybacking on another dango and cannot move independently this turn.",
      move:
        "{actor} eagerly bounces {steps} steps {direction}.",
      cellPropulsion:
        "Hit a Propulsion Device! The entire stack on that tile is pushed {steps} cells clockwise.",
      cellHindrance:
        "Hit a Hindrance Device! The entire stack on that tile is pushed {steps} cells counter-clockwise.",
      cellRift:
        "Caught in a Time Rift! The stack order on that tile is reshuffled.",
      win: "{winner} crosses the 32-step mark and claims the 2nd Anniversary Crown!",
      turnHeader: "Turn {turn} commences. The crowd holds its breath.",
    },
    skills: {
      carlottaDouble: "Resonance Skill triggered! {actor}'s roll doubles to {value}.",
      chisaUnderdog: "Underdog Awakening! {actor} pushes forward an extra 2 steps.",
      lynaeDouble: "{actor}'s skill flares up! The roll doubles to {value}.",
      lynaeStuck: "{actor}'s skill misfired. Stuck awkwardly in place for this turn.",
      aemeathLeap:
        "{actor} tears through space, leaping into the nearest stack ahead!",
      sigrikaMarkSingle:
        "{actor} marks {target}. Their movement is reduced by 1 this round.",
      sigrikaMarkDouble:
        "{actor} marks {firstTarget} and {secondTarget}. Their movement is reduced by 1 this round.",
      deniaRepeat:
        "{actor} matches her previous roll and bursts forward 2 extra steps.",
      hiyukiMetAbby:
        "{actor} meets {boss} and permanently gains 1 extra movement from future turns onward.",
      hiyukiBondedAdvance:
        "{actor}'s meeting with {boss} grants 1 extra step this turn.",
      phoebeLucky:
        "Luck smiles on {actor}, granting 1 extra step.",
      cartethyiaComebackAwaken:
        "{actor} drops to last place and enters Comeback state.",
      cartethyiaComebackBoost:
        "{actor}'s Comeback erupts for 2 extra steps.",
    },
  },
  banner: {
    turn: {
      headline: "Turn {turn} Begins",
    },
    teleport: {
      abbyHeadline: "Boss Abby warps to the start",
      stackHeadline: "{actor} jumps to a better position",
      abbyDetail: "Readjusting stance to terrorize the track once more",
      stackDetail: "Smoothly hopping onto the fast track",
    },
    idle: {
      standbyHeadline: "{actor} is warming up",
      standbyDetail: "Saving energy for the mid-game chaos",
      blockedHeadline: "{actor} yields control",
      blockedDetailWithRoll:
        "Rolled a {value}, but the dango at the bottom is driving",
      blockedDetail: "Just enjoying the free ride right now",
    },
    roll: {
      headline: "{actor} rolled a {value}",
      headlineFallback: "{actor} throws the dice",
      detail: "Let's see how far this takes them",
    },
    skill: {
      detail: "Resonance Skill Activated",
    },
    effect: {
      propulsionDevice: {
        headline: "Propulsion Device activated!",
      },
      hindranceDevice: {
        headline: "Hindrance Device activated!",
      },
      timeRift: {
        headline: "Time Rift activated!",
      },
    },
    slide: {
      headline: "Cell Effect Triggered",
      detail: "The whole stack is dragged along by the tile's force",
    },
    victory: {
      headline: "{winner} wins the Anniversary Sprint!",
      detail: "A flawless run. The stadium goes wild!",
    },
    bonusSlide: "Propulsion Boost",
  },
};