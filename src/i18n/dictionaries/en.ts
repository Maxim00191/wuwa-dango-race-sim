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
    bot1: "Plain Dango",
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
    jinhsi: "Jinhsi",
    changli: "Changli",
    calcharo: "Calcharo",
    augusta: "Augusta",
    iuno: "Iuno",
    phrolova: "Phrolova",
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
    tagline: "Festival Sprints, Resonator Competitions, and Tactical Divinations",
    views: {
      normal: "Dash Grounds",
      tournament: "Tournament Hub",
      knockout: "Knockout Tournament",
      analysis: "Festival Archives",
    },
    playback: {
      label: "Playback Speed",
      optionAria: "Set playback speed to {speed}x",
    },
    language: {
      label: "lang",
    },
  },
  theme: {
    switchToLightAria: "Switch to daylight theme",
    switchToDarkAria: "Switch to night theme",
    lightTitle: "Daylight theme",
    darkTitle: "Night theme",
    lightShortLabel: "Light",
    darkShortLabel: "Dark",
  },
  footer: {
    disclaimer:
      "This website is a fan-made simulation and does not represent actual in-game code or mechanics. It may produce behaviors inconsistent with the official game. All content is only for reference and entertainment. This is a purely fan-made project and is not affiliated with the official game.",
    githubLabel: "GitHub repo",
    bilibiliLabel: "Bilibili page",
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
      title: "Cubie Derby Sprint",
      description:
        "Hop, stack, and utilize track devices to dominate the single-match celebration circuit.",
      start: "Commence the Sprint",
    },
  },
  tournament: {
    session: {
      setup: "Tournament Seeding Room",
      finalsReady: "Finals Ready",
      raceFallback: "Celebration Competition",
      preliminaryComplete: "Preliminary Results Recorded",
      finalComplete: "Grand Final Results Recorded",
    },
    monteCarlo: {
      heading: "Bracket Divinations",
      title: "Simulate the full tournament or jump straight to the finals",
      description:
        "Stress-test both rounds to see how momentum carries, or calculate win rates based strictly on the current finals lineup.",
      scenarios: {
        tournament: {
          label: "Full Celebration Competition",
          description:
            "Run the preliminary, use the results to seed the final, and crown the champion.",
          analysisLabel: "Tournament Divination",
        },
        final: {
          label: "Current Grand Final Lineup",
          description:
            "Skip the prelims and simulate win rates for the current finals arrangement.",
          officialAnalysisLabel: "Final Divination",
          customAnalysisLabel: "Custom Final Divination",
        },
      },
    },
    shell: {
      eyebrow: "Tournament Center",
      title: "Cubie Derby Celebration Festival",
      description:
        "Complete a preliminary round to determine final seeding, or manually arrange a custom dream match.",
    },
    setup: {
      preliminary: {
        eyebrow: "Round 1",
        title: "Preliminary Sprint",
        description:
          "All competitors start at the line. Placements here will grant seeding advantages in the Final.",
        start: "Begin Preliminary",
        reset: "Reset Tournament Progress",
        lockedTitle: "Preliminary Standings Locked",
        empty:
          "Finish the prelims to auto-generate the finals bracket, or drag the badges on the right to set up a custom match.",
      },
      finals: {
        eyebrow: "Round 2",
        title: "Grand Final Lineup",
        description:
          "Proceed with the preliminary seedings, or drag the dangos to create a custom showdown.",
        helper:
          "Drag a dango to rearrange the order. You can also use the up and down arrow keys while a dango is selected.",
        ariaLabel: "Final Standings",
        placementAria: "Placement {placement}, {name}",
        start: "Launch Final",
        restore: "Restore Entered Seeding",
        roles: {
          startLine: "Starting Line",
          topOfStack: "Top of the stack",
          bottomOfStack: "Bottom of the stack",
        },
      },
    },
  },
  knockout: {
    session: {
      setup: "Knockout Preparation Room",
      complete: "Knockout Champion Crowned",
      awaiting: {
        groupA: "Ready for Group A",
        groupB: "Ready for Group B",
        winnersBracket: "Ready for Winner's Bracket",
        losersBracket: "Ready for Loser's Bracket",
        finals: "Ready for Finals",
      },
    },
    monteCarlo: {
      heading: "Knockout Divinations",
      title: "Simulate the full twelve-dango knockout Tournament",
      description:
        "Run five sprint races across group stage, dual brackets, and finals to crown a tournament champion.",
      scenario: {
        label: "Full Knockout Tournament",
        description:
          "Group A, Group B, winner's bracket, loser's bracket, and championship finals.",
        analysisLabel: "Knockout Tournament Divination",
      },
      lineupIncomplete:
        "Fill both six-dango groups with no duplicates before starting.",
    },
    shell: {
      eyebrow: "Elimination Grounds",
      title: "Cubie Derby Knockout Tournament",
      description:
        "Twelve dangos enter across two groups. Top three advance to the winner's bracket, bottom three to the loser's bracket, then six meet in the finals.",
    },
    phases: {
      groupA: "Group A",
      groupB: "Group B",
      winnersBracket: "Winner's Bracket",
      losersBracket: "Loser's Bracket",
      finals: "Finals",
    },
    setup: {
      groupA: {
        eyebrow: "Group A",
        title: "Group A Roster",
        label: "Group A",
        description:
          "Augusta, Jinhsi, Hiyuki, Iuno, Calcharo, Cartethyia",
      },
      groupB: {
        eyebrow: "Group B",
        title: "Group B Roster",
        label: "Group B",
        description: "Denia, Sigrika, Shorekeeper, Chisa, Carlotta, Aemeath",
      },
      progress: {
        eyebrow: "Bracket Progress",
        champion: "Knockout Champion: {name}",
      },
      actions: {
        start: "Start Knockout Tournament",
        advance: "Run {phase}",
        advanceIdle: "Continue Tournament",
        reset: "Reset Knockout Progress",
      },
    },
  },
  lineup: {
    heading: "Starting Roster",
    title: "Invite {count} dangos to the track",
    description:
      "Click a dango to invite them. Once the race heats up, Boss Abby will crash the party.",
    statusReady: "{selected} / {total} ready to go",
    statusOpen: "{selected} / {total} ready · {remaining} {spots} left",
    spotsOne: "slot",
    spotsOther: "slots",
    clear: "Clear selections",
    selected: "In Race",
    available: "Waiting",
    locked: "Full",
    attributeEmpty: "No dangos yet",
    modes: {
      attribute: "By Attribute",
      group: "By Group",
      attributeHint: "Build a custom six-dango lineup one pick at a time.",
      groupHint: "Load an official six-dango roster in a single click.",
    },
    groups: {
      selectAction: "Select Group {group}",
      active: "Current lineup",
      ready: "Ready",
      comingSoon: "Coming Soon",
      placeholderName: "Reserved Slot",
      a: {
        label: "Group A",
        description:
          "Luuk Herssen, Sigrika, Denia, Hiyuki, Phoebe, Cartethyia",
      },
      b: {
        label: "Group B",
        description:
          "Mornye, Carlotta, Shorekeeper, Lynae, Chisa, Aemeath",
      },
      c: {
        label: "Group C",
        description: "Jinhsi, Changli, Calcharo, Augusta, Iuno, Phrolova",
      },
    },
  },
  monteCarlo: {
    runBatch: "Run {count} times",
    useCustomNumber: "Use custom number",
    customRunsLabel: "Custom runs",
    customRunsUnit: "runs",
    customRunsPlaceholder: "100000",
    customRunsHint: "Enter any positive whole number.",
    customRunsInvalid: "Use a positive whole number.",
    stop: "Stop simulation",
    stopping: "Stopping...",
    progress: "Progress",
    timeRemaining: "Time remaining: {value}",
    standingBy: "Standing by",
    lineupIncomplete:
      "Gather all {count} dangos before starting the divination.",
    extremeMode: {
      label: "Performance mode",
      description:
        "Fully takes up CPU, and increases worker batches, and reduces progress messages. Progress updating will be delayed. Only recommended for 100,000 runs or more, otherwise it may be slower.",
      progressCoarse:
        "Running in the background, progress bar will be stuck and delayed.",
    },
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
      instantTurn: "Resolve turn",
      instantGame: "Resolve game",
    },
    replay: {
      clusterTitle: "Match replay & timeline",
      toolbarCaption: "Replay Timeline",
      idleHint:
        "Record automatically while playing; export anytime or import a json file.",
      jumpToPresent: "Jump to present",
      stepBack: "<- Back",
      stepForward: "Next ->",
      seekEngineTurn: "Total turns",
      seekTurnButton: "Seek to turn",
      replayAutoplay: "Replay auto-play",
      replayPause: "Pause replay",
      exportCopy: "Copy JSON",
      import: "Import JSON",
      scrubAria: "Seek along recorded timeline",
      importInvalid: "Could not read replay file.",
      bannersOn: "Banners on",
      bannersOff: "Banners off",
    },
    board: {
      panelTitle: "Live Track Broadcast",
      turnLabel: "Turn {turn}",
      winnerBadge: "Champion!",
      legend: {
        finishLine: {
          label: "Finish Line",
          description:
            "Victory requires completing the entire board, regardless of what happens here.",
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
        "Don't worry, the dangos are all ready! Detailed analytics and performance metrics will populate here afterward.",
      button: "Back to Track",
    },
    header: {
      eyebrow: "Data Analytics",
      description:
        "Generated from {runs} simulations of the current roster. Includes placement spreads, conditional win scenarios, and tournament flow.",
      back: "Return to Simulation",
      scrollToTop: "Go to Top",
    },
    tabs: {
      overview: "Overview",
      conditional: "If They Win...",
      tournament: "Tournament Flow",
      knockout: "Knockout Flow",
      observer: "Observer's Records",
    },
    observer: {
      intro:
        "The Observer kept only the most extreme matches from this batch. Each replay replaces the prior holder for that rule so memory stays bounded.",
      empty:
        "No observer records were captured for this batch. Run another simulation to populate extremes.",
      ruleTitles: {
        shortestMatch: "Super lucky match (fewest turns)",
        longestMatch: "Super marathon match (most turns)",
      }, 
      totalEngineTurns: "Total turns",
      preliminaryTurns: "Preliminary turns",
      finalTurns: "Final turns",
      champion: "Champion",
      preliminaryChampion: "Preliminary winner",
      unknownChampion: "Unknown",
      watchReplay: "Watch replay",
      watchPreliminaryReplay: "Watch preliminary replay",
      watchFinalReplay: "Watch final replay",
      knockoutPhaseReplay: {
        groupA: "Group A replay",
        groupB: "Group B replay",
        winnersBracket: "Winner bracket replay",
        losersBracket: "Loser bracket replay",
        finals: "Final groups replay",
      },
 
    },
    contexts: {
      sprint: "Sprint Analytics",
      preliminary: "Preliminary Analytics",
      final: "Finals Analytics",
      knockoutGroup: "Group Stage",
      knockoutBracket: "Bracket Stage",
      knockoutFinal: "Championship Finals",
    },
    knockout: {
      eyebrow: "Knockout Analytics",
      title: "Stats by bracket phase",
      description:
        "Numbers here come from your simulation counts as conditional rates—not from fixed bracket slots. They highlight comeback runs, which side of the bracket titles came from, and who actually finishes when they reach the final.",
      tabs: {
        flow: "Bracket flow",
        competitors: "Competitors",
        drilldown: "Details",
      },
      championshipTitle: "Championship rate",
      championshipDescription:
        "Share of simulations where each dango wins after all five knockout races.",
      groupTitle: "Group stage win rate",
      advancementTitle: "Top-three group results",
      topThreeToFinals: "Reached grand final",
      topThreeToChampion: "Won tournament after a top-three group finish",
      winnersPathChampion: "Titles via winner's bracket",
      winnersPathChampionHint:
        "Share of titles where the champion had entered the winner's bracket",
      losersPathChampion: "Titles via loser's bracket",
      losersPathChampionHint:
        "Share of titles where the champion had entered the loser's bracket",
      finalistConversionLeader: "Best finals conversion",
      finalistConversionLeaderHint: "Wins {rate} of finals they reach",
      noFinalistData: "No finals data yet",
      comebackShareOfCups: "Titles from loser's path",
      comebackShareOfCupsHint:
        "Share of all simulations where the champion came through the loser's bracket",
      laneFinalClose: "Reach final → win title",
      laneFinalCloseHint:
        "Among finalists who took this bracket path, share who won the tournament",
      laneStructuralNote:
        "Raw path counts grow with bracket size and batch size; the funnel rates below show what actually happened.",
      flowComebackKingTitle: "Comeback performance",
      flowComebackKingDescription:
        "Among players who showed up in the loser's bracket, the highest title rate once a minimum sample is met",
      comebackKingSample: "{count} loser's-bracket paths",
      flowPathSplitTitle: "Where titles came from",
      flowPathSplitDescription:
        "When this competitor won, how the title split between the winner's bracket route and the loser's bracket route",
      pathSplitWinnerShare: "{rate} · Winner's path",
      pathSplitLoserShare: "{rate} · Loser's path",
      pathSplitTitles: "{count} titles in sample",
      flowPremiumLaneTitle: "Winner's path gap",
      flowPremiumLaneDescription:
        "Often starts on the winner's path, but titles make up a smaller share of runs than you'd expect. Gap = share of runs on the winner's path minus share of runs won.",
      premiumLaneOccupancy: "Runs on winner's path",
      premiumLaneTitles: "Runs won",
      premiumLaneSpread: "Gap (path − titles)",
      flowFinalChokeTitle: "Low finals conversion",
      flowFinalChokeDescription:
        "Players who reach the grand final often but win rarely (sorted by finals-to-title rate, lowest first)",
      flowEmptySample: "Not enough data yet",
      entries: "Appearances",
      entriesHint: "How many times this path occurred in the batch",
      finalists: "Final trips",
      finalistsHint: "Times this path reached the championship final",
      conversion: "Finals conversion rate",
      conversionHint: "Share of finals from this path that ended in a title",
      winnersLaneTitle: "Winner's bracket funnel",
      winnersLaneDescription:
        "Title rate after reaching the grand final from this path—not a sum of raw appearances across paths.",
      losersLaneTitle: "Loser's bracket funnel",
      losersLaneDescription:
        "How well loser's-bracket finalists close out; read as titles per grand final reached.",
      competitorTitle: "Competitor paths",
      competitorDescription:
        "Each row splits group seeding, bracket survival, and title rate after reaching the final, so early exits stay comparable to long runs.",
      reachFinal: "Reach grand final",
      finalConversion: "Finals → title",
      titles: "Titles",
      drilldownEyebrow: "Path details",
      drilldownDescription:
        "Only stages this competitor actually played appear here, so short runs are not mixed with full bracket paths.",
      phaseGroup: "Group Stage",
      phaseWinners: "Winner's Bracket",
      phaseLosers: "Loser's Bracket",
      phaseFinal: "Championship Finals",
      toWinners: "To Winner's",
      toLosers: "To Loser's",
      toFinal: "To Finals",
      toChampion: "To Champion",
      titleShare: "Overall title share",
      selectCompetitor: "Select competitor",
      flowGraphTitle: "Knockout flow graph",
      flowGraphDescription:
        "Percentages come from this competitor's knockout counts: links show routing given they reached the previous stage; the main number on each node is their share of all simulations in the batch.",
      flowGraphPicker: "View by competitor",
      flowGraphEmpty: "Run a knockout simulation batch to see the flow graph.",
      flowGraphNodeCup: "Full bracket",
      flowGraphRuns: "Batch: {count} tournaments",
      flowGraphNodeCupHint:
        "Each run uses the fixed twelve-dango schedule from group races through the grand final.",
      flowGraphParticipation:
        "Share of the batch where they reached their group stage",
      flowGraphGroupMeta: "Observed group-stage paths: {runs}",
      flowGraphBracketPhase: "Winner's vs. loser's bracket",
      flowGraphBracketMeta: "Times on this path: {runs}",
      flowGraphJoint: "Marginal · {rate} of all tournaments",
      flowGraphMerge: "Six-player grand final",
      flowGraphFinalMeta: "Grand final appearances: {runs}",
      flowGraphConditionalFinalToTitle: "Given they reached the grand final",
      flowGraphChampion: "Champion",
      flowGraphTitlesMeta: "Total titles across paths: {count}",
      flowGraphFromWinners: "Grand finals via winner's path",
      flowGraphFromLosers: "Grand finals via loser's path",
      flowGraphCupViaWinners: "Titles through winner's bracket",
      flowGraphCupViaLosers: "Titles through loser's bracket",
      flowGraphUnknownGroup: "Group assignment (custom seeding)",
    },
    metrics: {
      averageTournamentLength: "Avg Tournament Length",
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
    funStats: {
      eyebrow: "Divinations",
      title: "Performance Analysis",
      intro:
        "How are the dangos doing, are they chilling or sweating?",
      runtimeLabel: "Total runtime",
      runtimeHint: "Time from task start to statistics end.",
      throughputLabel: "Matches per dango per second",
      throughputHint:
        "That's so fast, are they taking a rocket?",
      marathonLabel: "Full Marathon equivalents",
      marathonHint:
        "Full marathon ≈ 42,195 m. Distance ≈ {cells} forward board cells summed across the roster (1 cell ≈ 1 m).",
      methodology:
        "Data from aggregated positive displacement (own-turn gains plus off-turn gains).",
      unavailable: "—",
      runtimeUnavailable: "—",
    },
    overview: {
      winRateEyebrow: "Win Rate Overview",
      winRateTitleTournament: "Who dominates the Tournament?",
      winRateTitleRace: "Who claims the Anniversary Sprint the most?",
      finalOnly: "Final placements only",
      averageFinish: "Avg Rank: {value}",
      stabilityLensEyebrow: "Consistency Check",
      stabilityLensTitle: "How reliable is each competitor?",
      stabilityLensDescription:
        "High consistency means predictable placements. Low consistency means wild swings between 1st place and dead last.",
      mostStable: "Steady as a Rock",
      mostVolatile: "Rollercoaster",
      averageFinishShort: "Avg Finish",
      standardDeviation: "Std Dev",
      boomOrBust: "Hero or Zero",
      distributionEyebrow: "Placement Distribution",
      distributionTitle: "The complete 1st-to-6th breakdown",
      distributionHint:
        "Colors map from 1st place (left) to 6th place (right)",
      stabilityScore: "Consistency {value}",
      stabilityScoreLabel: "Consistency Score",
      winRate: "Win Rate",
      podiumRate: "Top 3 Rate",
      bottomTwoRate: "Bottom 2 Rate",
      metaEyebrow: "Mechanic Utilization Analysis",
      metaTitle: "Hitchhiking Gains, Stacking Mechanics, and Cell Events",
      metaDescription:
        "These tables separate self-driven progress from carried progress, then cross-reference stack roles and special cells against final win conversion.",
      passengerLeader: "Hitchhiking Efficiency King",
      passengerLeaderHint: "Highest title conversion once carried progress takes over: {rate}",
      driverLeader: "Bottom of the Stack",
      driverLeaderHint: "Spends {rate} of observed turns at the bottom of the stack",
      resilienceLeader: "Hindrance Survival King",
      resilienceLeaderHint: "Wins {rate} of scenarios after hitting Hindrance devices",
      passengerEfficiencyTitle: "Hitchhiking Efficiency Rankings",
      stackEcosystemTitle: "Stack Ecosystem Exposure",
      trapAffinityTitle: "Cell Trigger Rate & Resilience",
      carriedShare: "Carried Share",
      carriedPerRide: "Carry / Ride",
      carriedLeadConversion: "Carried Lead -> Win",
      driverShare: "Bottom",
      passengerShare: "Passenger",
      crownShare: "Top",
      soloShare: "Solo",
      hindranceRate: "Hindrance Rate",
      hindranceResilience: "Hindrance -> Win",
      highHindranceConversion: "2+ Hindrance -> Win",
      propulsionRate: "Propulsion Rate",
      timeRiftRate: "Time Rift Rate",
    },
    conditional: {
      eyebrow: "Scenario Analytics",
      title: "If this dango takes 1st, where does everyone else end up?",
      description:
        "Pick a champion to filter the simulations. See who usually rides their coattails to 2nd place, and who gets left in the dust.",
      tableDango: "Competitor",
      averageFinish: "Avg Rank: {value}",
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
      eyebrow: "Tournament Analytics",
      title: "Prelim Momentum & Final Comebacks",
      description:
        "See how preliminary performance translates to final victory. Find out who chokes under pressure and who thrives from behind.",
      topSeedConverts: "Prelim Leader Conversion",
      topSeedConvertsHint:
        "How often the 1st place prelim winner also wins the Final",
      bottomHalfComeback: "Underdog Comeback",
      bottomHalfComebackHint:
        "How often the 4th-, 5th-, or 6th-place preliminary finisher wins the Final",
      bestFrontrunner: "Best Frontrunner",
      bestRecoveryArtist: "Comeback Kid",
      bestDebtSurvivor: "Best Back-Row Starter",
      topSeedHint: "{rate} win rate after finishing 1st in prelims",
      underdogHint: "{rate} win rate after finishing 4th-6th in prelims",
      maxDebtHint: "{rate} win rate from the furthest-back Final start",
      noTopSeedData: "Not enough Prelim leader data yet",
      noUnderdogData: "Not enough comeback data yet",
      noMaxDebtData: "Not enough furthest-back start data yet",
      maxDebtComeback: "Back-Row Comeback",
      maxDebtComebackHint:
        "How often a racer wins the Final after starting furthest from the finish",
      overallChoke: "Overall Choke Rate",
      overallChokeHint: "Top 2 preliminary finishers that fall into the Final bottom 2",
      overallClutch: "Overall Clutch Rate",
      overallClutchHint: "Bottom 2 preliminary finishers that recover to a Final podium",
      averageShift: "Avg Rank Shift",
      averageShiftHint: "Final rank minus preliminary rank across tournament entries",
      seedDecayEyebrow: "Final Starting Position Decay",
      seedDecayTitle: "Final win rate by exact starting position",
      seedDecayDescription:
        "Each starting-position bucket only uses Final races, where racers begin in different spots before stacking can develop.",
      seedLabel: "Starting Position {value}",
      volatilityEyebrow: "Volatility & Shift Index",
      volatilityTitle: "Choke and clutch rates by racer",
      rankShift: "Rank Shift",
      chokeRate: "Choke Rate",
      clutchRate: "Clutch Rate",
      deprivationEyebrow: "Prelim vs Final Performance Gap",
      deprivationTitle: "Average rank in the preliminary vs Final",
      conversionEyebrow: "Individual Conversion Rates",
      conversionTitle: "Early Leads vs Comeback Potential",
      titles: "Won {count} times",
      ifFirstInPrelims: "If 1st in Prelims",
      ifFourthToSixthInPrelims: "If 4th-6th in Prelims",
      ifStartAtMaxDebt: "If Starting Furthest Back",
      matchingPrelimRuns: "{count} prelim matches",
      underdogEntries: "{count} underdog scenarios",
      maxDebtEntries: "{count} furthest-back finals",
      preliminaryWinnerPlacementEyebrow: "Preliminary Winner Fallout",
      preliminaryWinnerPlacementTitle: "Where does the preliminary winner finish?",
      preliminaryWinnerPlacementDescription:
        "This strips away character identity and shows the final landing distribution for whoever entered the Grand Final as the preliminary winner.",
      transitionEyebrow: "Placement Heatmap",
      totalTitles: "{count} total wins",
      transitionDescription:
        "Rows represent Preliminary rank, columns represent Final rank. Read horizontally to see how early seeding predicts the final outcome.",
      prelimHeader: "Prelim \\ Final",
    },
  },
  skills: {
    names: {
      luukHerssen: "Have a Candy",
      sigrika: "Solar Spirit, Lend Me a Hand",
      denia: "Good Things Come in Pairs",
      hiyuki: "Guiding White Bird",
      cartethyia: "Comeback Scene",
      phoebe: "Blessings of the Sentinel",
      mornye: "Precision Calculation",
      shorekeeper: "Convergent Future",
      chisa: "Visual Threshold Unveiled",
      carlotta: "Profit Doubled",
      lynae: "Dazzling Moment",
      aemeath: "Digital Ghost, on the scene~",
      augusta: "The Ephor's Authority",
      iuno: "Anchored Destiny",
      phrolova: "Elegant Intrigue",
      changli: "Plan Before Acting",
      jinhsi: "The Name of the Lingyin",
      calcharo: "Misery follows",
    },
  },
  simulation: {
    labels: {
      normalRace: "Anniversary Sprint",
      tournamentPreliminary: "Tournament Prelims",
      tournamentFinal: "Grand Final",
      customFinal: "Custom Finals",
      finalsReady: "Finals Ready",
      tournamentSetup: "Tournament Seeding Room",
      knockout: {
        groupA: "Knockout · Group A",
        groupB: "Knockout · Group B",
        winnersBracket: "Knockout · Winner's Bracket",
        losersBracket: "Knockout · Loser's Bracket",
        finals: "Knockout · Finals",
      },
    },
    log: {
      abbyResetScheduled:
        "{actor} fell too far behind and will be warped back to the starting line next turn.",
      abbyTeleport:
        "{actor} turns into a beam of light and flashes back to the start, ready for a new charge.",
      standby:
        "{actor} is still warming up on the sidelines. The boss will drop in once the pace picks up.",
      roll: "{actor} rolled a {value}.",
      skipNotBottom:
        "{actor} is riding on another dango's back, just going with the flow.",
      move:
        "{actor} eagerly advances {steps} steps {direction}.",
      cellPropulsion:
        "Hit a Propulsion Device! The entire stack on that tile is pushed {steps} cells clockwise.",
      cellHindrance:
        "Hit a Hindrance Device! The entire stack on that tile is pushed {steps} cells counter-clockwise.",
      cellRift:
        "Caught in a Time Rift! The stack order on that tile is reshuffled.",
      win: "{winner} crosses the finish line and claims the victory!",
      turnHeader: "Turn {turn} commences. The crowd holds its breath.",
    },
    skills: {
      carlottaDouble: "Skill triggered! {actor}'s roll doubles to {value}.",
      chisaUnderdog: "Skill triggered! {actor} pushes forward an extra 2 steps.",
      lynaeDouble: "{actor}'s skill flares up! The roll doubles to {value}.",
      lynaeStuck: "{actor}'s skill misfired. Stuck awkwardly in place for this turn.",
      aemeathLeap:
        "Skill triggered! {actor} leaps into the nearest dango ahead!",
      sigrikaMarkSingle:
        "{actor} marks {target}. Their movement is reduced by 1 this round.",
      sigrikaMarkDouble:
        "{actor} marks {firstTarget} and {secondTarget}. Their movement is reduced by 1 this round.",
      deniaRepeat:
        "{actor} matches her previous roll and advances 2 extra steps.",
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
      jinhsiStackAscend:
        "{actor} invokes Magistrate's Name and ascends through the stack to seize the highest perch.",
      changliActLastNextRound:
        "{actor} acts with Plan Before Resolve, setting the stage to perform the grand finale next round.",
      calcharoLastPlaceBoost:
        "{actor} moves Like a Shadow, surging from last place for 3 extra steps.",
      augustaGovernorAuthority:
        "{actor} exercises Governor's Authority, yielding this round to deliver the grand finale next round.",
      iunoAnchoredDestiny:
        "{actor} invokes Anchored Destiny, gathering every other racer ranked ahead and behind onto the same tile while preserving their standings order in the stack.",
      phrolovaBottomBoost:
        "{actor} unveils Elegant Conspiracy from the base of the stack and gains 3 extra steps.",
    },
  },
  banner: {
    turn: {
      headline: "Turn {turn} Begins",
    },
    teleport: {
      abbyHeadline: "Boss Abby warps to the start",
      stackHeadline: "{actor} jumps to a better position",
      abbyDetail: "Readjusting stance to dominate the track once more",
      stackDetail: "Smoothly hopping onto the fast track",
    },
    idle: {
      standbyHeadline: "{actor} is warming up",
      standbyDetail: "The best is yet to come; the boss will join later.",
      blockedHeadline: "{actor} yields control",
      blockedDetailWithRoll:
        "Rolled a {value}, but the dango at the bottom is the driver.",
      blockedDetail: "Just enjoying the free ride right now",
    },
    roll: {
      headline: "{actor} rolled a {value}",
      headlineFallback: "{actor} throws the dice",
      detail: "Let's see how far this can take them...",
    },
    skill: {
      headline: "{actor}: {skill}!",
      detail: "Resonance unleashed!",
      details: {
        activate: "Passive skill shaping this exchange.",
        carlotta: {
          double: "Profit Doubled hits—the dice doubles up.",
        },
        chisa: {
          underdog: "Lowest roll this round earns two bonus steps.",
        },
        lynae: {
          double: "Dazzling Moment! doubles the roll.",
          stuck: "Failed to activate! — no movement this turn.",
        },
        aemeath: {
          leap: "Digital Ghost warps to the nearest rival ahead.",
        },
        sigrika: {
          markSingle:
            "Solar Spirit marks {markedDango1} — movement trimmed by one step.",
          markDouble:
            "Solar Spirit marks {markedDango1} and {markedDango2} — movement trimmed by one step each.",
        },
        denia: {
          repeat: "Matching roll—two bonus steps locked in.",
        },
        hiyuki: {
          metAbby:
            "Guiding White Bird bonds with Boss Abby for a lasting pace boost.",
          bondedAdvance: "Guiding White Bird adds one step this turn.",
        },
        phoebe: {
          lucky: "Blessings of the Sentinel add one step.",
        },
        cartethyia: {
          awaken: "Comeback Scene arms after hitting last place.",
          boost: "Comeback Scene story unfolds! Extra two bonus steps.",
        },
        jinhsi: {
          stackAscend: "With the Name of the Lingyin, leaps to the stack top.",
        },
        changli: {
          actLastNextRound:
            "Plan Before Acting — finale queued for next round.",
        },
        calcharo: {
          lastPlaceBoost:
            "Misery follows from the back—three bonus steps.",
        },
        augusta: {
          governorAuthority:
            "The Ephor's Authority — skips this turn, finale queued next round.",
        },
        iuno: {
          anchoredDestiny:
            "Anchored Destiny rallies rivals onto the same tile.",
        },
        phrolova: {
          bottomBoost:
            "Elegant Intrigue from the stack base—three bonus steps.",
        },
      },
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