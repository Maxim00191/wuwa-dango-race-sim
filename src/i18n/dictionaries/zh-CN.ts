import type { TranslationDictionary } from "@/i18n/types";

export const zhCnDictionary: TranslationDictionary = {
  meta: {
    title: "鸣潮二周年：小团快跑模拟器",
  },
  locale: {
    en: "English",
    "zh-CN": "简体中文",
  },
  characters: {
    bot1: "白板团子",
    mornye: "莫宁",
    aemeath: "爱弥斯",
    lynae: "琳奈",
    carlotta: "珂莱塔",
    chisa: "千咲",
    shorekeeper: "守岸人",
    luukHerssen: "陆·赫斯",
    sigrika: "西格莉卡",
    denia: "达妮娅",
    hiyuki: "绯雪",
    phoebe: "菲比",
    cartethyia: "卡提希娅",
    jinhsi: "今夕",
    changli: "长离",
    calcharo: "卡卡罗",
    augusta: "奥古斯塔",
    iuno: "尤诺",
    phrolova: "弗洛洛",
    abby: "布大王",
  },
  attributes: {
    fusion: "热熔",
    glacio: "冷凝",
    aero: "气动",
    electro: "导电",
    spectro: "衍射",
    havoc: "湮灭",
  },
  common: {
    directions: {
      clockwise: "顺时针",
      counterClockwise: "逆时针",
    },
    placements: {
      "0": "第 1 名",
      "1": "第 2 名",
      "2": "第 3 名",
      "3": "第 4 名",
      "4": "第 5 名",
      "5": "第 6 名",
    },
    cells: {
      label: "第 {cell} 格",
    },
    actions: {
      drag: "拖动",
    },
    notes: {
      one: "{count} 条记录",
      other: "{count} 条记录",
    },
  },
  nav: {
    brand: "鸣潮二周年：小团快跑模拟器",
    tagline: "周年庆典赛、共鸣者竞赛与赛况推演",
    views: {
      normal: "竞速场",
      tournament: "赛程大厅",
      analysis: "庆典档案",
    },
    playback: {
      label: "播放速度",
      optionAria: "将播放速度设置为 {speed}x",
    },
    language: {
      label: "语言",
    },
  },
  theme: {
    switchToLightAria: "切换至白昼主题",
    switchToDarkAria: "切换至夜色主题",
    lightTitle: "白昼主题",
    darkTitle: "夜色主题",
    lightShortLabel: "浅色",
    darkShortLabel: "深色",
  },
  footer: {
    disclaimer:
      "本网站仅提供基于个人创作的模拟程序，并不代表实际游戏内代码运行情况，可能会产生与游戏不符合的表现，所有内容仅供参考和娱乐。本站仅为玩家二创内容，与官方无关。",
  },
  normal: {
    session: {
      idle: "等待二周年庆典开赛",
      fallback: "二周年冲刺",
    },
    monteCarlo: {
      heading: "赛况推演",
      title: "快速模拟当前二周年阵容",
      description:
        "对选定的六只团子进行高速演算，看看谁的夺冠胜率更高、比赛节奏又有多快。",
      scenario: {
        label: "二周年冲刺",
        description: "每场推演都将从初始叠层状态起跑。",
        analysisLabel: "二周年冲刺推演",
      },
      lineupIncomplete: "需要集齐 {count} 只团子才能启动推演台。",
    },
    shell: {
      eyebrow: "二周年赛场",
      title: "索拉里斯冲刺",
      description:
        "跳跃、叠层、利用赛道装置，在单场庆典规则下争夺第一名。",
      start: "开始竞赛",
    },
  },
  tournament: {
    session: {
      setup: "赛程筹备室",
      finalsReady: "决战就绪",
      raceFallback: "庆典竞赛",
      preliminaryComplete: "预赛成绩已录入",
      finalComplete: "决赛成绩已生成",
    },
    monteCarlo: {
      heading: "赛程推演",
      title: "模拟完整赛程或直击决赛",
      description:
        "你可以选择连同预赛一起进行高强度压测，也可以直接对当前的决赛阵容进行胜率演算。",
      scenarios: {
        tournament: {
          label: "完整庆典竞赛",
          description: "先跑预赛，根据成绩排布决赛顺位，最终决出冠军。",
          analysisLabel: "庆典赛程推演",
        },
        final: {
          label: "当前决赛阵容",
          description: "跳过预赛，直接模拟当前这组决赛站位的赛况。",
          officialAnalysisLabel: "决赛推演",
          customAnalysisLabel: "自定义决赛推演",
        },
      },
    },
    shell: {
      eyebrow: "赛事中心",
      title: "索拉里斯庆典杯",
      description:
        "完成预赛以决定总决赛的顺位，或者你也可以直接自定义一场梦幻决赛。",
    },
    setup: {
      preliminary: {
        eyebrow: "第一轮",
        title: "预赛阶段",
        description: "所有团子同一起跑线出发，完赛名次将直接决定决赛的站位优势。",
        start: "开始预赛",
        reset: "重置赛程进度",
        lockedTitle: "预赛顺位已锁定",
        empty: "跑完预赛后会自动生成决赛阵容。你也可以直接在右侧自由编排决赛顺位。",
      },
      finals: {
        eyebrow: "第二轮",
        title: "决赛阵容",
        description:
          "保留预赛结果直接开启巅峰对决，或者拖拽名牌来一场自定义赛局。",
        helper: "拖拽名牌可以调整顺位；选中名牌后，使用上下方向键也能进行微调。",
        ariaLabel: "决赛顺位列表",
        placementAria: "第 {placement} 位，{name}",
        start: "开启总决赛",
        restore: "恢复录入的顺位",
        roles: {
          startLine: "起跑线",
          topOfStack: "叠层最上方",
          bottomOfStack: "叠层最下方",
        },
      },
    },
  },
  lineup: {
    heading: "参赛阵容",
    title: "邀请 {count} 只团子加入二周年赛道",
    description: "点击名牌即可邀请团子入场。比赛正式打响后，布大王将以首领身份强势介入。",
    statusReady: "{selected} / {total} 已就位",
    statusOpen: "{selected} / {total} 已就位 · 还有 {remaining} 个空位",
    spotsOne: "名额",
    spotsOther: "名额",
    clear: "清空选择",
    selected: "参赛中",
    available: "待加入",
    locked: "已满",
    attributeEmpty: "暂无团子",
    modes: {
      attribute: "按属性",
      group: "按编组",
      attributeHint: "按属性逐个挑选，自由组建六人阵容。",
      groupHint: "一键载入官方六人预设编组。",
    },
    groups: {
      selectAction: "选择 {group}",
      active: "当前阵容",
      ready: "可用",
      comingSoon: "敬请期待",
      placeholderName: "预留席位",
      a: {
        label: "编组 A",
        description: "陆·赫斯、西格莉卡、达妮娅、绯雪、菲比、卡提希娅",
      },
      b: {
        label: "编组 B",
        description: "莫宁、珂莱塔、守岸人、琳奈、千咲、爱弥斯",
      },
      c: {
        label: "编组 C",
        description: "今夕、长离、卡卡罗、奥古斯塔、尤诺、弗洛洛",
      },
    },
  },
  monteCarlo: {
    runBatch: "运行 {count} 次",
    useCustomNumber: "使用自定义次数",
    customRunsLabel: "自定义次数",
    customRunsUnit: "次",
    customRunsPlaceholder: "5000",
    customRunsHint: "可输入任意正整数。",
    customRunsInvalid: "请输入正整数。",
    stop: "停止推演",
    stopping: "正在停止...",
    progress: "推演进度",
    standingBy: "待命中",
    lineupIncomplete: "需要集齐 {count} 只团子才能启动推演台。",
  },
  game: {
    controls: {
      watch: "观赛模式",
      step: "下一步",
      playTurn: "播放一回合",
      playingTurn: "正在播放...",
      pauseAuto: "暂停自动演播",
      autoRun: "开启自动演播",
      reset: "重置赛道",
      quickRuns: "快速结算",
      instantTurn: "直接结算本回合",
      instantGame: "直接得出本场结果",
    },
    board: {
      panelTitle: "赛道实况",
      turnLabel: "第 {turn} 回合",
      winnerBadge: "冠军诞生",
      legend: {
        finishLine: {
          label: "终点",
          description: "不管起点距离终点有多近，都必须完整跑完赛场才能夺下冠军。",
        },
        propulsion: {
          label: "推进装置",
          description: "落在这里时，会将该格上的整层团子一起向顺时针方向额外推进 1 格。",
        },
        hindrance: {
          label: "阻遏装置",
          description: "落在这里时，会将该格上的整层团子一起向逆时针方向推回 1 格。",
        },
        rift: {
          label: "时空裂隙",
          description: "落在这里会打乱该格团子的叠层顺序，但布大王会始终停在最底层。",
        },
        stacks: {
          label: "叠层机制",
          description: "落在同一格的团子会整齐地叠在一起，不仅视野清晰，还能一起搭顺风车。",
        },
      },
      ariaLabel: "由三十二个格子组成的环形庆典赛道",
    },
    queue: {
      title: "本回合行动顺序",
    },
    racers: {
      title: "参赛选手",
      bossRole: "首领位 · 骰面更大 · 逆时针追击",
      basicRole: "常规位 · 骰面较小 · 顺时针前进",
      dice: "掷出 {value}",
    },
    diary: {
      title: "实况日志",
      empty: "比赛打响后，赛道上发生的精彩瞬间都会记录在这里。",
    },
  },
  analysis: {
    empty: {
      eyebrow: "档案室",
      title: "暂无推演数据",
      description: "别担心，团子们都准备就绪了！演算完成后，详细的赛况分析会在这里生成。",
      button: "返回赛道",
    },
    header: {
      eyebrow: "数据分析",
      description:
        "基于当前阵容的 {runs} 次模拟得出，包含名次分布、特定条件下的战局推演，以及杯赛多轮次的表现趋势。",
      back: "返回模拟",
    },
    tabs: {
      overview: "总览数据",
      conditional: "若Ta夺冠",
      tournament: "赛程趋势",
    },
    metrics: {
      averageTournamentLength: "平均赛程长度",
      averageRaceLength: "平均单局长度",
      averageTournamentLengthHint: "包含预赛与总决赛的总回合数",
      averageRaceLengthHint: "平均需要多少回合才能完赛",
      fastestFinish: "最速通关",
      fastestFinishHint: "本批次模拟中用时最短的一局",
      titleShare: "最高夺冠率",
      titleShareHint: "{name} 捧杯的次数最多",
      noWinnerData: "暂无冠军数据",
      bottomHalfComeback: "下半区逆袭率",
      bestStability: "发挥最稳定",
      bottomHalfComebackHint: "预赛排在 4-6 名却最终夺冠的概率",
      stabilityHint: "{name} 的名次波动最小",
      noStabilityData: "暂无稳定性数据",
    },
    overview: {
      winRateEyebrow: "胜率总览",
      winRateTitleTournament: "谁最容易赛程出线？",
      winRateTitleRace: "谁最容易赢下单场冲刺赛",
      finalOnly: "仅统计最终名次",
      averageFinish: "平均排位 {value}",
      stabilityLensEyebrow: "稳定性分析",
      stabilityLensTitle: "选手们的发挥有多稳定？",
      stabilityLensDescription: "稳定性越高，说明该选手的名次越集中；稳定性越低，代表Ta可能上一局还在拿第一，下一局就垫底了。",
      mostStable: "稳如泰山",
      mostVolatile: "大起大落",
      averageFinishShort: "平均名次",
      standardDeviation: "标准差",
      boomOrBust: "非神即坑",
      distributionEyebrow: "名次分布图",
      distributionTitle: "各选手的综合实力画像",
      distributionHint: "色带从左到右依次代表第 1 名到第 6 名的概率",
      stabilityScore: "稳定性 {value}",
      winRate: "夺冠率",
      podiumRate: "前三率",
      bottomTwoRate: "垫底率",
    },
    conditional: {
      eyebrow: "条件推演",
      title: "如果Ta拿了第一，其他团子都在哪？",
      description: "选择一位冠军选手，系统会筛选出Ta夺冠的所有对局，让你看清在这种剧本下，其他选手的命运如何。",
      tableDango: "选手",
      averageFinish: "平均名次 {value}",
      runs: "{count} 局",
      scenarioSlice: "特定情境",
      matchingRuns: "匹配到 {count} 局",
      matchingRunsHint: "在所有模拟中，有 {rate} 的对局是这位选手夺冠。",
      likelyRunnerUp: "最有可能拿亚军",
      likelyLast: "最有可能垫底",
      secondPlaceChance: "拿到第 2 名的概率为 {rate}",
      sixthPlaceChance: "垫底的概率为 {rate}",
      noMatchingRuns: "未匹配到相关对局",
    },
    tournament: {
      eyebrow: "赛程深度分析",
      title: "顺位转化与逆风翻盘",
      description: "追踪预赛顺位与最终结果的关联，看看谁能一路高歌猛进，谁又能在逆境中完成惊天翻盘。",
      topSeedConverts: "头号种子转化率",
      topSeedConvertsHint: "预赛拿第一且决赛也拿第一的概率",
      bottomHalfComeback: "下半区逆袭夺冠",
      bottomHalfComebackHint: "预赛排在 4-6 名，却在决赛拿下第一的概率",
      bestFrontrunner: "最强领跑者",
      bestRecoveryArtist: "翻盘小能手",
      topSeedHint: "预赛第 1 名的最终夺冠率为 {rate}",
      underdogHint: "预赛 4-6 名的最终夺冠率为 {rate}",
      noTopSeedData: "缺少头号种子的数据样本",
      noUnderdogData: "缺少逆袭夺冠的数据样本",
      conversionEyebrow: "单体转化率",
      conversionTitle: "前期优势与翻盘潜力",
      titles: "出线 {count} 次",
      ifFirstInPrelims: "若预赛排第 1",
      ifFourthToSixthInPrelims: "若预赛排 4-6 名",
      matchingPrelimRuns: "{count} 次预赛样本",
      underdogEntries: "{count} 次逆风样本",
      transitionEyebrow: "顺位转化热力图",
      totalTitles: "共出线 {count} 次",
      transitionDescription: "行代表预赛名次，列代表决赛名次。可以直接读取预赛名次对最终结果的概率影响。",
      prelimHeader: "预赛顺位",
    },
  },
  simulation: {
    labels: {
      normalRace: "二周年冲刺",
      tournamentPreliminary: "赛程预选",
      tournamentFinal: "巅峰决战",
      customFinal: "自定义决赛",
      finalsReady: "决战就绪",
      tournamentSetup: "赛程筹备室",
    },
    log: {
      abbyResetScheduled: "{actor} 落在队伍最后方，下回合将被直接传送回起点。",
      abbyTeleport: "{actor} 化作一道光闪回起跑线，准备发起新一轮冲击。",
      standby: "{actor} 还在场外热身。等比赛节奏加快后，首领才会真正下场。",
      roll: "{actor} 掷出 {value} 点。",
      skipNotBottom: "{actor} 踩在别的团子背上，随波逐流。",
      move: "{actor} 沿着{direction}轻快地前进了 {steps} 格。",
      cellPropulsion: "踩中推进装置！该格上的整层团子都被顺时针推进了 {steps} 格。",
      cellHindrance: "触发阻遏装置！该格上的整层团子都被逆时针推回了 {steps} 格。",
      cellRift: "卷入时空裂隙！该格的叠层顺序被打乱。",
      win: "{winner} 率先跑完一整圈，拿下了本场比赛的冠军！",
      turnHeader: "第 {turn} 回合开始，全场屏息以待。",
    },
    skills: {
      carlottaDouble: "{actor} 的技能触发！点数翻倍至 {value}。",
      chisaUnderdog: "{actor} 触发技能！额外前进 2 步。",
      lynaeDouble: "{actor} 的技能闪耀！点数翻倍至 {value}。",
      lynaeStuck: "{actor} 的技能发生故障，本回合只能尴尬地留在原地。",
      aemeathLeap: "{actor} 触发技能！直接跃迁到了前方最近的团子上！",
      sigrikaMarkSingle:
        "{actor} 锁定了 {target}，使其本回合移动减少 1 格。",
      sigrikaMarkDouble:
        "{actor} 锁定了 {firstTarget} 与 {secondTarget}，使其本回合移动都减少 1 格。",
      deniaRepeat:
        "{actor} 掷出了与上回合相同的点数，额外前进 2 格。",
      hiyukiMetAbby:
        "{actor} 与 {boss} 正面相遇，此后每回合都会永久额外获得 1 格移动。",
      hiyukiBondedAdvance:
        "{actor} 与 {boss} 的相遇带来了 1 格额外移动。",
      phoebeLucky:
        "{actor} 运气爆棚，额外获得 1 格移动。",
      cartethyiaComebackAwaken:
        "{actor} 掉到末位，进入翻盘状态。",
      cartethyiaComebackBoost:
        "{actor} 的翻盘状态爆发，额外获得 2 格移动。",
      jinhsiStackAscend:
        "{actor} 瞬间跃上了层叠最上方，占住了最高点。",
      changliActLastNextRound:
        "{actor} 收束节奏，下回合将压轴行动。",
      calcharoLastPlaceBoost:
        "{actor} 身处末位却骤然爆发，额外获得 3 格移动。",
    },
  },
  banner: {
    turn: {
      headline: "第 {turn} 回合开始",
    },
    teleport: {
      abbyHeadline: "布大王重返起跑线",
      stackHeadline: "{actor} 跃向了优势层叠",
      abbyDetail: "首领调整姿态，准备重新接管比赛",
      stackDetail: "轻巧地改变站位，随大流继续前行",
    },
    idle: {
      standbyHeadline: "{actor} 仍在热身",
      standbyDetail: "好戏还在后头，首领稍后入场",
      blockedHeadline: "{actor} 本回合放弃行动",
      blockedDetailWithRoll: "虽然掷出了 {value} 点，但底下的团子才是车头",
      blockedDetail: "现在的移动全权交给底下的赛手负责",
    },
    roll: {
      headline: "{actor} 掷出了 {value}",
      headlineFallback: "{actor} 丢出骰子",
      detail: "看看这波能跑多远...",
    },
    skill: {
      detail: "共鸣解放高光时刻",
    },
    effect: {
      propulsionDevice: {
        headline: "推进装置触发！",
      },
      hindranceDevice: {
        headline: "阻遏装置触发！",
      },
      timeRift: {
        headline: "时空裂隙启动！",
      },
    },
    slide: {
      headline: "格子机关触发",
      detail: "整层团子都被格子的力量一起带走了",
    },
    victory: {
      headline: "{winner} 赢下二周年冲刺赛！",
      detail: "跑满全图，全场欢呼声震耳欲聋",
    },
    bonusSlide: "额外推进",
  },
};