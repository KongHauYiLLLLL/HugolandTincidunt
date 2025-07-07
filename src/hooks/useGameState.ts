import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, Enemy, ChestReward, RelicItem, AdventureSkill, MenuSkill, MerchantReward } from '../types/game';
import { generateWeapon, generateArmor, generateEnemy, generateRelicItem, getChestRarityWeights } from '../utils/gameUtils';
import { getRandomQuestion, checkAnswer } from '../utils/triviaQuestions';
import { checkAchievements, initializeAchievements } from '../utils/achievements';
import { checkPlayerTags, initializePlayerTags } from '../utils/playerTags';
import AsyncStorage from '../utils/storage';

const STORAGE_KEY = 'hugoland-game-state';

const createInitialGameState = (): GameState => ({
  coins: 500,
  gems: 50,
  shinyGems: 0,
  zone: 1,
  playerStats: {
    hp: 100,
    maxHp: 100,
    atk: 25,
    def: 15,
    baseAtk: 25,
    baseDef: 15,
    baseHp: 100,
  },
  inventory: {
    weapons: [],
    armor: [],
    relics: [],
    currentWeapon: null,
    currentArmor: null,
    equippedRelics: [],
  },
  currentEnemy: null,
  inCombat: false,
  combatLog: [],
  isPremium: false,
  achievements: initializeAchievements(),
  collectionBook: {
    weapons: {},
    armor: {},
    totalWeaponsFound: 0,
    totalArmorFound: 0,
    rarityStats: {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythical: 0,
    },
  },
  knowledgeStreak: {
    current: 0,
    best: 0,
    multiplier: 1,
  },
  gameMode: {
    current: 'normal',
    speedModeActive: false,
    survivalLives: 3,
    maxSurvivalLives: 3,
  },
  statistics: {
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    totalPlayTime: 0,
    zonesReached: 1,
    itemsCollected: 0,
    coinsEarned: 0,
    gemsEarned: 0,
    shinyGemsEarned: 0,
    chestsOpened: 0,
    accuracyByCategory: {},
    sessionStartTime: new Date(),
    totalDeaths: 0,
    totalVictories: 0,
    longestStreak: 0,
    fastestVictory: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    itemsUpgraded: 0,
    itemsSold: 0,
    totalResearchSpent: 0,
    averageAccuracy: 0,
    revivals: 0,
  },
  cheats: {
    infiniteCoins: false,
    infiniteGems: false,
    obtainAnyItem: false,
  },
  mining: {
    totalGemsMined: 0,
    totalShinyGemsMined: 0,
  },
  yojefMarket: {
    items: [],
    lastRefresh: new Date(),
    nextRefresh: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
  },
  playerTags: initializePlayerTags(),
  dailyRewards: {
    lastClaimDate: null,
    currentStreak: 0,
    maxStreak: 0,
    availableReward: null,
    rewardHistory: [],
  },
  progression: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    skillPoints: 0,
    unlockedSkills: [],
    prestigeLevel: 0,
    prestigePoints: 0,
    masteryLevels: {},
  },
  offlineProgress: {
    lastSaveTime: new Date(),
    offlineCoins: 0,
    offlineGems: 0,
    offlineTime: 0,
    maxOfflineHours: 8,
  },
  gardenOfGrowth: {
    isPlanted: false,
    plantedAt: null,
    lastWatered: null,
    waterHoursRemaining: 0,
    growthCm: 0,
    totalGrowthBonus: 0,
    seedCost: 1000,
    waterCost: 1000,
    maxGrowthCm: 100,
  },
  settings: {
    colorblindMode: false,
    darkMode: true,
    language: 'en',
    notifications: true,
    snapToGrid: false,
    beautyMode: false,
  },
  hasUsedRevival: false,
  skills: {
    activeMenuSkill: null,
    lastRollTime: null,
    playTimeThisSession: 0,
    sessionStartTime: new Date(),
  },
  adventureSkills: {
    selectedSkill: null,
    availableSkills: [],
    showSelectionModal: false,
    skillEffects: {
      skipCardUsed: false,
      metalShieldUsed: false,
      dodgeUsed: false,
      truthLiesActive: false,
      lightningChainActive: false,
      rampActive: false,
      berserkerActive: false,
      vampiricActive: false,
      phoenixUsed: false,
      timeSlowActive: false,
      criticalStrikeActive: false,
      shieldWallActive: false,
      poisonBladeActive: false,
      arcaneShieldActive: false,
      battleFrenzyActive: false,
      elementalMasteryActive: false,
      shadowStepUsed: false,
      healingAuraActive: false,
      doubleStrikeActive: false,
      manaShieldActive: false,
      berserkRageActive: false,
      divineProtectionUsed: false,
      stormCallActive: false,
      bloodPactActive: false,
      frostArmorActive: false,
      fireballActive: false,
    },
  },
  research: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    totalSpent: 0,
    bonuses: {
      atk: 0,
      def: 0,
      hp: 0,
      coinMultiplier: 1,
      gemMultiplier: 1,
      xpMultiplier: 1,
    },
  },
  multipliers: {
    coins: 1,
    gems: 1,
    atk: 1,
    def: 1,
    hp: 1,
  },
  merchant: {
    hugollandFragments: 0,
    totalFragmentsEarned: 0,
    lastFragmentZone: 0,
    showRewardModal: false,
    availableRewards: [],
  },
});

const generateYojefMarketItems = (): RelicItem[] => {
  const items: RelicItem[] = [];
  const itemCount = 3 + Math.floor(Math.random() * 3); // 3-5 items
  
  for (let i = 0; i < itemCount; i++) {
    items.push(generateRelicItem());
  }
  
  return items;
};

const generateAdventureSkills = (): AdventureSkill[] => {
  const allSkills: AdventureSkill[] = [
    {
      id: 'risker_1',
      name: 'Risker',
      description: 'Start with 50% HP but gain +100% ATK',
      type: 'risker'
    },
    {
      id: 'lightning_chain_1',
      name: 'Lightning Chain',
      description: 'Correct answers have 30% chance to deal double damage',
      type: 'lightning_chain'
    },
    {
      id: 'skip_card_1',
      name: 'Skip Card',
      description: 'Skip one question and automatically get it correct',
      type: 'skip_card'
    },
    {
      id: 'metal_shield_1',
      name: 'Metal Shield',
      description: 'Block the first enemy attack completely',
      type: 'metal_shield'
    },
    {
      id: 'truth_lies_1',
      name: 'Truth & Lies',
      description: 'Remove one wrong answer from multiple choice questions',
      type: 'truth_lies'
    },
    {
      id: 'ramp_1',
      name: 'Ramp',
      description: 'Gain +10% ATK for each correct answer (stacks)',
      type: 'ramp'
    },
    {
      id: 'dodge_1',
      name: 'Dodge',
      description: 'First wrong answer deals no damage',
      type: 'dodge'
    },
    {
      id: 'berserker_1',
      name: 'Berserker',
      description: 'Deal +50% damage when below 50% HP',
      type: 'berserker'
    },
    {
      id: 'vampiric_1',
      name: 'Vampiric',
      description: 'Heal 25% of damage dealt',
      type: 'vampiric'
    },
    {
      id: 'phoenix_1',
      name: 'Phoenix',
      description: 'Revive once with 50% HP when defeated',
      type: 'phoenix'
    },
    {
      id: 'time_slow_1',
      name: 'Time Slow',
      description: 'Get +3 seconds for each question',
      type: 'time_slow'
    },
    {
      id: 'critical_strike_1',
      name: 'Critical Strike',
      description: '20% chance to deal triple damage',
      type: 'critical_strike'
    },
    {
      id: 'shield_wall_1',
      name: 'Shield Wall',
      description: 'Take 50% less damage from all attacks',
      type: 'shield_wall'
    },
    {
      id: 'poison_blade_1',
      name: 'Poison Blade',
      description: 'Attacks poison enemies for 3 turns',
      type: 'poison_blade'
    },
    {
      id: 'arcane_shield_1',
      name: 'Arcane Shield',
      description: 'Absorb first 100 damage taken',
      type: 'arcane_shield'
    },
    {
      id: 'battle_frenzy_1',
      name: 'Battle Frenzy',
      description: 'Each kill increases ATK by 25%',
      type: 'battle_frenzy'
    },
    {
      id: 'elemental_mastery_1',
      name: 'Elemental Mastery',
      description: 'Deal bonus damage based on question category',
      type: 'elemental_mastery'
    },
    {
      id: 'shadow_step_1',
      name: 'Shadow Step',
      description: 'Avoid next enemy attack after wrong answer',
      type: 'shadow_step'
    },
    {
      id: 'healing_aura_1',
      name: 'Healing Aura',
      description: 'Regenerate 10 HP after each correct answer',
      type: 'healing_aura'
    },
    {
      id: 'double_strike_1',
      name: 'Double Strike',
      description: 'Attack twice on correct answers',
      type: 'double_strike'
    },
    {
      id: 'mana_shield_1',
      name: 'Mana Shield',
      description: 'Convert 50% damage to mana cost',
      type: 'mana_shield'
    },
    {
      id: 'berserk_rage_1',
      name: 'Berserk Rage',
      description: 'Gain rage stacks that increase damage',
      type: 'berserk_rage'
    },
    {
      id: 'divine_protection_1',
      name: 'Divine Protection',
      description: 'Immune to death once per adventure',
      type: 'divine_protection'
    },
    {
      id: 'storm_call_1',
      name: 'Storm Call',
      description: 'Lightning strikes deal area damage',
      type: 'storm_call'
    },
    {
      id: 'blood_pact_1',
      name: 'Blood Pact',
      description: 'Sacrifice HP to deal massive damage',
      type: 'blood_pact'
    }
  ];

  // Return 3 random skills
  const shuffled = allSkills.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

const generateMenuSkill = (): MenuSkill => {
  const skillTypes = [
    'coin_vacuum', 'treasurer', 'xp_surge', 'luck_gem', 'enchanter', 'time_warp',
    'golden_touch', 'knowledge_boost', 'durability_master', 'relic_finder',
    'stat_amplifier', 'question_master', 'gem_magnet', 'streak_guardian',
    'revival_blessing', 'zone_skipper', 'item_duplicator', 'research_accelerator',
    'garden_booster', 'market_refresh', 'coin_multiplier', 'gem_multiplier',
    'xp_multiplier', 'damage_boost', 'defense_boost', 'health_boost',
    'speed_boost', 'luck_boost', 'magic_shield', 'auto_heal'
  ];

  const randomType = skillTypes[Math.floor(Math.random() * skillTypes.length)] as MenuSkill['type'];
  
  const skillData = {
    coin_vacuum: { name: 'Coin Vacuum', description: 'Get 15 free coins per minute of play time', duration: 60 },
    treasurer: { name: 'Treasurer', description: 'Guarantees next chest opened is epic or better', duration: 1 },
    xp_surge: { name: 'XP Surge', description: 'Gives 300% XP gains for 24 hours', duration: 24 },
    luck_gem: { name: 'Luck Gem', description: 'All gems mined for 1 hour are shiny gems', duration: 1 },
    enchanter: { name: 'Enchanter', description: 'Epic+ drops have 80% chance to be enchanted', duration: 2 },
    time_warp: { name: 'Time Warp', description: 'Get 50% more time to answer questions for 12 hours', duration: 12 },
    golden_touch: { name: 'Golden Touch', description: 'All coin rewards are doubled for 8 hours', duration: 8 },
    knowledge_boost: { name: 'Knowledge Boost', description: 'Knowledge streaks build 50% faster for 24 hours', duration: 24 },
    durability_master: { name: 'Durability Master', description: 'Items lose no durability for 6 hours', duration: 6 },
    relic_finder: { name: 'Relic Finder', description: 'Next 3 Yojef Market refreshes have guaranteed legendary relics', duration: 24 },
    stat_amplifier: { name: 'Stat Amplifier', description: 'All stats (ATK, DEF, HP) increased by 50% for 4 hours', duration: 4 },
    question_master: { name: 'Question Master', description: 'See question category and difficulty before answering for 2 hours', duration: 2 },
    gem_magnet: { name: 'Gem Magnet', description: 'Triple gem rewards from all sources for 3 hours', duration: 3 },
    streak_guardian: { name: 'Streak Guardian', description: 'Knowledge streak cannot be broken for 1 hour', duration: 1 },
    revival_blessing: { name: 'Revival Blessing', description: 'Gain 3 extra revival chances for this session', duration: 24 },
    zone_skipper: { name: 'Zone Skipper', description: 'Skip directly to zone +5 without fighting', duration: 1 },
    item_duplicator: { name: 'Item Duplicator', description: 'Next item found is automatically duplicated', duration: 1 },
    research_accelerator: { name: 'Research Accelerator', description: 'Research costs 50% less for 6 hours', duration: 6 },
    garden_booster: { name: 'Garden Booster', description: 'Garden grows 5x faster for 2 hours', duration: 2 },
    market_refresh: { name: 'Market Refresh', description: 'Instantly refresh Yojef Market with premium items', duration: 1 },
    coin_multiplier: { name: 'Coin Multiplier', description: 'All coin gains are multiplied by 3x for 4 hours', duration: 4 },
    gem_multiplier: { name: 'Gem Multiplier', description: 'All gem gains are multiplied by 2.5x for 3 hours', duration: 3 },
    xp_multiplier: { name: 'XP Multiplier', description: 'All experience gains are multiplied by 4x for 2 hours', duration: 2 },
    damage_boost: { name: 'Damage Boost', description: 'Deal 100% more damage in combat for 5 hours', duration: 5 },
    defense_boost: { name: 'Defense Boost', description: 'Take 75% less damage in combat for 6 hours', duration: 6 },
    health_boost: { name: 'Health Boost', description: 'Maximum health increased by 200% for 8 hours', duration: 8 },
    speed_boost: { name: 'Speed Boost', description: 'Answer time increased by 100% for 3 hours', duration: 3 },
    luck_boost: { name: 'Luck Boost', description: 'All random events have 50% better outcomes for 4 hours', duration: 4 },
    magic_shield: { name: 'Magic Shield', description: 'Immune to all negative effects for 2 hours', duration: 2 },
    auto_heal: { name: 'Auto Heal', description: 'Automatically heal 25% HP every minute for 1 hour', duration: 1 }
  };

  const skill = skillData[randomType];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + skill.duration * 60 * 60 * 1000);

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: skill.name,
    description: skill.description,
    duration: skill.duration,
    activatedAt: now,
    expiresAt,
    type: randomType
  };
};

const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load game state from storage
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Convert date strings back to Date objects
          if (parsedState.statistics?.sessionStartTime) {
            parsedState.statistics.sessionStartTime = new Date(parsedState.statistics.sessionStartTime);
          }
          if (parsedState.offlineProgress?.lastSaveTime) {
            parsedState.offlineProgress.lastSaveTime = new Date(parsedState.offlineProgress.lastSaveTime);
          }
          if (parsedState.gardenOfGrowth?.plantedAt) {
            parsedState.gardenOfGrowth.plantedAt = new Date(parsedState.gardenOfGrowth.plantedAt);
          }
          if (parsedState.gardenOfGrowth?.lastWatered) {
            parsedState.gardenOfGrowth.lastWatered = new Date(parsedState.gardenOfGrowth.lastWatered);
          }
          if (parsedState.yojefMarket?.lastRefresh) {
            parsedState.yojefMarket.lastRefresh = new Date(parsedState.yojefMarket.lastRefresh);
          }
          if (parsedState.yojefMarket?.nextRefresh) {
            parsedState.yojefMarket.nextRefresh = new Date(parsedState.yojefMarket.nextRefresh);
          }
          if (parsedState.skills?.sessionStartTime) {
            parsedState.skills.sessionStartTime = new Date(parsedState.skills.sessionStartTime);
          }
          if (parsedState.skills?.lastRollTime) {
            parsedState.skills.lastRollTime = new Date(parsedState.skills.lastRollTime);
          }
          if (parsedState.skills?.activeMenuSkill?.activatedAt) {
            parsedState.skills.activeMenuSkill.activatedAt = new Date(parsedState.skills.activeMenuSkill.activatedAt);
          }
          if (parsedState.skills?.activeMenuSkill?.expiresAt) {
            parsedState.skills.activeMenuSkill.expiresAt = new Date(parsedState.skills.activeMenuSkill.expiresAt);
          }

          // Calculate offline progress
          const now = Date.now();
          const lastSave = parsedState.offlineProgress.lastSaveTime.getTime();
          const offlineTimeSeconds = Math.floor((now - lastSave) / 1000);
          const maxOfflineSeconds = parsedState.offlineProgress.maxOfflineHours * 3600;
          const actualOfflineTime = Math.min(offlineTimeSeconds, maxOfflineSeconds);

          if (actualOfflineTime > 60) { // Only if offline for more than 1 minute
            const offlineCoinsPerSecond = parsedState.research.level * 0.1;
            const offlineGemsPerSecond = parsedState.research.level * 0.01;
            
            parsedState.offlineProgress.offlineTime = actualOfflineTime;
            parsedState.offlineProgress.offlineCoins = Math.floor(actualOfflineTime * offlineCoinsPerSecond);
            parsedState.offlineProgress.offlineGems = Math.floor(actualOfflineTime * offlineGemsPerSecond);
          }

          // Update garden growth
          if (parsedState.gardenOfGrowth.isPlanted && parsedState.gardenOfGrowth.waterHoursRemaining > 0) {
            const hoursOffline = actualOfflineTime / 3600;
            let growthRate = 0.5; // cm per hour
            
            // Apply garden booster skill effect
            if (parsedState.skills?.activeMenuSkill?.type === 'garden_booster' && 
                new Date() <= parsedState.skills.activeMenuSkill.expiresAt) {
              growthRate *= 5;
            }
            
            const newGrowth = Math.min(hoursOffline * growthRate, parsedState.gardenOfGrowth.maxGrowthCm - parsedState.gardenOfGrowth.growthCm);
            
            parsedState.gardenOfGrowth.growthCm += newGrowth;
            parsedState.gardenOfGrowth.waterHoursRemaining = Math.max(0, parsedState.gardenOfGrowth.waterHoursRemaining - hoursOffline);
            parsedState.gardenOfGrowth.totalGrowthBonus = parsedState.gardenOfGrowth.growthCm * 5;
          }

          // Check if Yojef Market needs refresh
          if (parsedState.yojefMarket && new Date() >= parsedState.yojefMarket.nextRefresh) {
            parsedState.yojefMarket.items = generateYojefMarketItems();
            parsedState.yojefMarket.lastRefresh = new Date();
            parsedState.yojefMarket.nextRefresh = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
          }

          // Check if menu skill has expired
          if (parsedState.skills?.activeMenuSkill && new Date() > parsedState.skills.activeMenuSkill.expiresAt) {
            parsedState.skills.activeMenuSkill = null;
          }

          setGameState(parsedState);
        } else {
          const initialState = createInitialGameState();
          initialState.yojefMarket.items = generateYojefMarketItems();
          setGameState(initialState);
        }
      } catch (error) {
        console.error('Error loading game state:', error);
        const initialState = createInitialGameState();
        initialState.yojefMarket.items = generateYojefMarketItems();
        setGameState(initialState);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameState();
  }, []);

  // Auto-save game state
  useEffect(() => {
    if (gameState && !isLoading) {
      const saveGameState = async () => {
        try {
          gameState.offlineProgress.lastSaveTime = new Date();
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
        } catch (error) {
          console.error('Error saving game state:', error);
        }
      };

      const timeoutId = setTimeout(saveGameState, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [gameState, isLoading]);

  // Yojef Market timer check - runs every 10 seconds
  useEffect(() => {
    if (!gameState) return;

    const checkYojefMarket = () => {
      if (new Date() >= gameState.yojefMarket.nextRefresh) {
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            yojefMarket: {
              ...prev.yojefMarket,
              items: generateYojefMarketItems(),
              lastRefresh: new Date(),
              nextRefresh: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
            }
          };
        });
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkYojefMarket, 10000);
    return () => clearInterval(interval);
  }, [gameState]);

  const updateGameState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState(prev => {
      if (!prev) return prev;
      return updater(prev);
    });
  }, []);

  const applyMenuSkillEffects = (baseValue: number, skillType: string, effectType: string): number => {
    if (!gameState?.skills.activeMenuSkill || new Date() > gameState.skills.activeMenuSkill.expiresAt) {
      return baseValue;
    }

    const skill = gameState.skills.activeMenuSkill;
    
    switch (skill.type) {
      case 'golden_touch':
      case 'coin_multiplier':
        if (effectType === 'coins') return baseValue * (skill.type === 'coin_multiplier' ? 3 : 2);
        break;
      case 'gem_magnet':
      case 'gem_multiplier':
        if (effectType === 'gems') return baseValue * (skill.type === 'gem_multiplier' ? 2.5 : 3);
        break;
      case 'xp_surge':
      case 'xp_multiplier':
        if (effectType === 'xp') return baseValue * (skill.type === 'xp_multiplier' ? 4 : 3);
        break;
      case 'stat_amplifier':
        if (['atk', 'def', 'hp'].includes(effectType)) return baseValue * 1.5;
        break;
      case 'damage_boost':
        if (effectType === 'damage') return baseValue * 2;
        break;
      case 'defense_boost':
        if (effectType === 'defense') return baseValue * 0.25; // 75% less damage
        break;
      case 'health_boost':
        if (effectType === 'maxHp') return baseValue * 3; // 200% increase
        break;
    }
    
    return baseValue;
  };

  const applyAdventureSkillEffects = (baseValue: number, effectType: string): number => {
    if (!gameState?.adventureSkills.selectedSkill) return baseValue;

    const skill = gameState.adventureSkills.selectedSkill;
    const effects = gameState.adventureSkills.skillEffects;

    switch (skill.type) {
      case 'risker':
        if (effectType === 'atk') return baseValue * 2;
        if (effectType === 'startHp') return baseValue * 0.5;
        break;
      case 'berserker':
        if (effectType === 'atk' && gameState.playerStats.hp < gameState.playerStats.maxHp * 0.5) {
          return baseValue * 1.5;
        }
        break;
      case 'shield_wall':
        if (effectType === 'damage_taken') return baseValue * 0.5;
        break;
      case 'ramp':
        if (effectType === 'atk' && effects.rampActive) {
          const rampStacks = gameState.knowledgeStreak.current;
          return baseValue * (1 + rampStacks * 0.1);
        }
        break;
    }

    return baseValue;
  };

  const equipWeapon = useCallback((weapon: Weapon) => {
    updateGameState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        currentWeapon: weapon,
      },
    }));
  }, [updateGameState]);

  const equipArmor = useCallback((armor: Armor) => {
    updateGameState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        currentArmor: armor,
      },
    }));
  }, [updateGameState]);

  const upgradeWeapon = useCallback((weaponId: string) => {
    updateGameState(prev => {
      const weapon = prev.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon) return prev;

      let upgradeCost = weapon.upgradeCost;
      
      // Apply research accelerator skill effect
      if (prev.skills.activeMenuSkill?.type === 'research_accelerator' && 
          new Date() <= prev.skills.activeMenuSkill.expiresAt) {
        upgradeCost = Math.floor(upgradeCost * 0.5);
      }

      if (prev.gems < upgradeCost) return prev;

      const updatedWeapons = prev.inventory.weapons.map(w =>
        w.id === weaponId
          ? { ...w, level: w.level + 1, baseAtk: w.baseAtk + 10, upgradeCost: Math.floor(w.upgradeCost * 1.5) }
          : w
      );

      const updatedCurrentWeapon = prev.inventory.currentWeapon?.id === weaponId
        ? updatedWeapons.find(w => w.id === weaponId) || prev.inventory.currentWeapon
        : prev.inventory.currentWeapon;

      return {
        ...prev,
        gems: prev.gems - upgradeCost,
        inventory: {
          ...prev.inventory,
          weapons: updatedWeapons,
          currentWeapon: updatedCurrentWeapon,
        },
        statistics: {
          ...prev.statistics,
          itemsUpgraded: prev.statistics.itemsUpgraded + 1,
        },
      };
    });
  }, [updateGameState]);

  const upgradeArmor = useCallback((armorId: string) => {
    updateGameState(prev => {
      const armor = prev.inventory.armor.find(a => a.id === armorId);
      if (!armor) return prev;

      let upgradeCost = armor.upgradeCost;
      
      // Apply research accelerator skill effect
      if (prev.skills.activeMenuSkill?.type === 'research_accelerator' && 
          new Date() <= prev.skills.activeMenuSkill.expiresAt) {
        upgradeCost = Math.floor(upgradeCost * 0.5);
      }

      if (prev.gems < upgradeCost) return prev;

      const updatedArmor = prev.inventory.armor.map(a =>
        a.id === armorId
          ? { ...a, level: a.level + 1, baseDef: a.baseDef + 5, upgradeCost: Math.floor(a.upgradeCost * 1.5) }
          : a
      );

      const updatedCurrentArmor = prev.inventory.currentArmor?.id === armorId
        ? updatedArmor.find(a => a.id === armorId) || prev.inventory.currentArmor
        : prev.inventory.currentArmor;

      return {
        ...prev,
        gems: prev.gems - upgradeCost,
        inventory: {
          ...prev.inventory,
          armor: updatedArmor,
          currentArmor: updatedCurrentArmor,
        },
        statistics: {
          ...prev.statistics,
          itemsUpgraded: prev.statistics.itemsUpgraded + 1,
        },
      };
    });
  }, [updateGameState]);

  const sellWeapon = useCallback((weaponId: string) => {
    updateGameState(prev => {
      const weapon = prev.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon || prev.inventory.currentWeapon?.id === weaponId) return prev;

      let sellPrice = weapon.sellPrice;
      
      // Apply coin multiplier effects
      sellPrice = applyMenuSkillEffects(sellPrice, '', 'coins');

      return {
        ...prev,
        coins: prev.coins + sellPrice,
        inventory: {
          ...prev.inventory,
          weapons: prev.inventory.weapons.filter(w => w.id !== weaponId),
        },
        statistics: {
          ...prev.statistics,
          itemsSold: prev.statistics.itemsSold + 1,
          coinsEarned: prev.statistics.coinsEarned + sellPrice,
        },
      };
    });
  }, [updateGameState]);

  const sellArmor = useCallback((armorId: string) => {
    updateGameState(prev => {
      const armor = prev.inventory.armor.find(a => a.id === armorId);
      if (!armor || prev.inventory.currentArmor?.id === armorId) return prev;

      let sellPrice = armor.sellPrice;
      
      // Apply coin multiplier effects
      sellPrice = applyMenuSkillEffects(sellPrice, '', 'coins');

      return {
        ...prev,
        coins: prev.coins + sellPrice,
        inventory: {
          ...prev.inventory,
          armor: prev.inventory.armor.filter(a => a.id !== armorId),
        },
        statistics: {
          ...prev.statistics,
          itemsSold: prev.statistics.itemsSold + 1,
          coinsEarned: prev.statistics.coinsEarned + sellPrice,
        },
      };
    });
  }, [updateGameState]);

  const openChest = useCallback((cost: number): ChestReward | null => {
    if (!gameState || gameState.coins < cost) return null;

    const weights = getChestRarityWeights(cost);
    const random = Math.random() * 100;
    
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical' = 'common';
    let cumulative = 0;
    
    const rarities: ('common' | 'rare' | 'epic' | 'legendary' | 'mythical')[] = ['common', 'rare', 'epic', 'legendary', 'mythical'];
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        rarity = rarities[i];
        break;
      }
    }

    // Apply menu skill effects
    const isEnchanted = gameState.skills.activeMenuSkill?.type === 'enchanter' && 
                       ['epic', 'legendary', 'mythical'].includes(rarity) && 
                       Math.random() < 0.8;

    // Apply treasurer skill effect
    if (gameState.skills.activeMenuSkill?.type === 'treasurer') {
      rarity = Math.random() < 0.5 ? 'epic' : 'legendary';
    }

    const isWeapon = Math.random() < 0.5;
    let item = isWeapon ? generateWeapon(false, rarity, isEnchanted) : generateArmor(false, rarity, isEnchanted);

    // Apply item duplicator skill effect
    let items = [item];
    if (gameState.skills.activeMenuSkill?.type === 'item_duplicator') {
      const duplicatedItem = isWeapon ? generateWeapon(false, rarity, isEnchanted) : generateArmor(false, rarity, isEnchanted);
      items.push(duplicatedItem);
    }

    updateGameState(prev => {
      const newInventory = isWeapon
        ? { ...prev.inventory, weapons: [...prev.inventory.weapons, ...items as Weapon[]] }
        : { ...prev.inventory, armor: [...prev.inventory.armor, ...items as Armor[]] };

      // Update collection book
      const newCollectionBook = { ...prev.collectionBook };
      items.forEach(item => {
        if (isWeapon) {
          if (!newCollectionBook.weapons[item.name]) {
            newCollectionBook.weapons[item.name] = true;
            newCollectionBook.totalWeaponsFound += 1;
          }
        } else {
          if (!newCollectionBook.armor[item.name]) {
            newCollectionBook.armor[item.name] = true;
            newCollectionBook.totalArmorFound += 1;
          }
        }
        newCollectionBook.rarityStats[item.rarity] += 1;
      });

      let bonusGems = Math.floor(Math.random() * 10) + 5;
      bonusGems = applyMenuSkillEffects(bonusGems, '', 'gems');

      return {
        ...prev,
        coins: prev.coins - cost,
        gems: prev.gems + bonusGems,
        inventory: newInventory,
        collectionBook: newCollectionBook,
        statistics: {
          ...prev.statistics,
          chestsOpened: prev.statistics.chestsOpened + 1,
          itemsCollected: prev.statistics.itemsCollected + items.length,
          gemsEarned: prev.statistics.gemsEarned + bonusGems,
        },
      };
    });

    return {
      type: isWeapon ? 'weapon' : 'armor',
      items: items as (Weapon | Armor)[],
    };
  }, [gameState, updateGameState]);

  const discardItem = useCallback((itemId: string, type: 'weapon' | 'armor') => {
    updateGameState(prev => {
      if (type === 'weapon') {
        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            weapons: prev.inventory.weapons.filter(w => w.id !== itemId),
          },
        };
      } else {
        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            armor: prev.inventory.armor.filter(a => a.id !== itemId),
          },
        };
      }
    });
  }, [updateGameState]);

  const purchaseMythical = useCallback((coins: number): { weapon?: Weapon; armor?: Armor } | null => {
    if (!gameState || gameState.coins < coins) return null;

    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, 'mythical') : generateArmor(false, 'mythical');

    updateGameState(prev => {
      const newInventory = isWeapon
        ? { ...prev.inventory, weapons: [...prev.inventory.weapons, item as Weapon] }
        : { ...prev.inventory, armor: [...prev.inventory.armor, item as Armor] };

      return {
        ...prev,
        coins: prev.coins - coins,
        inventory: newInventory,
        statistics: {
          ...prev.statistics,
          itemsCollected: prev.statistics.itemsCollected + 1,
        },
      };
    });

    return isWeapon ? { weapon: item as Weapon } : { armor: item as Armor };
  }, [gameState, updateGameState]);

  const startCombat = useCallback(() => {
    updateGameState(prev => {
      const enemy = generateEnemy(prev.zone);
      
      // Generate adventure skills for selection
      const availableSkills = generateAdventureSkills();
      
      // Apply risker skill effect to starting HP
      let startingHp = prev.playerStats.maxHp;
      const hasRisker = prev.adventureSkills.selectedSkill?.type === 'risker';
      if (hasRisker) {
        startingHp = Math.floor(startingHp * 0.5);
      }

      return {
        ...prev,
        currentEnemy: enemy,
        inCombat: true,
        combatLog: [`You encounter a ${enemy.name} in Zone ${prev.zone}!`],
        playerStats: {
          ...prev.playerStats,
          hp: startingHp,
        },
        adventureSkills: {
          ...prev.adventureSkills,
          availableSkills,
          showSelectionModal: true,
          skillEffects: {
            skipCardUsed: false,
            metalShieldUsed: false,
            dodgeUsed: false,
            truthLiesActive: false,
            lightningChainActive: false,
            rampActive: false,
            berserkerActive: false,
            vampiricActive: false,
            phoenixUsed: false,
            timeSlowActive: false,
            criticalStrikeActive: false,
            shieldWallActive: false,
            poisonBladeActive: false,
            arcaneShieldActive: false,
            battleFrenzyActive: false,
            elementalMasteryActive: false,
            shadowStepUsed: false,
            healingAuraActive: false,
            doubleStrikeActive: false,
            manaShieldActive: false,
            berserkRageActive: false,
            divineProtectionUsed: false,
            stormCallActive: false,
            bloodPactActive: false,
            frostArmorActive: false,
            fireballActive: false,
          },
        },
      };
    });
  }, [updateGameState]);

  const attack = useCallback((hit: boolean, category?: string) => {
    updateGameState(prev => {
      if (!prev.currentEnemy) return prev;

      let newState = { ...prev };
      let damage = 0;
      let enemyDamage = 0;
      let logMessages: string[] = [];

      // Calculate player damage
      if (hit) {
        let baseAtk = prev.playerStats.atk;
        
        // Apply adventure skill effects
        baseAtk = applyAdventureSkillEffects(baseAtk, 'atk');
        
        // Apply menu skill effects
        baseAtk = applyMenuSkillEffects(baseAtk, '', 'damage');
        
        damage = Math.max(1, baseAtk - prev.currentEnemy.def);
        
        // Apply lightning chain effect
        if (prev.adventureSkills.selectedSkill?.type === 'lightning_chain' && Math.random() < 0.3) {
          damage *= 2;
          logMessages.push('⚡ Lightning Chain activated! Double damage!');
        }
        
        // Apply critical strike effect
        if (prev.adventureSkills.selectedSkill?.type === 'critical_strike' && Math.random() < 0.2) {
          damage *= 3;
          logMessages.push('💥 Critical Strike! Triple damage!');
        }
        
        // Apply double strike effect
        if (prev.adventureSkills.selectedSkill?.type === 'double_strike') {
          damage *= 2;
          logMessages.push('⚔️ Double Strike! Attacking twice!');
        }
        
        // Apply elemental mastery bonus
        if (prev.adventureSkills.selectedSkill?.type === 'elemental_mastery' && category) {
          const bonusMultiplier = {
            'Math': 1.3,
            'Science': 1.4,
            'Geography': 1.2,
            'History': 1.3,
            'Literature': 1.2,
            'Technology': 1.4,
            'Sports': 1.2,
            'Music': 1.2,
            'Art': 1.2,
            'Entertainment': 1.2
          };
          damage = Math.floor(damage * (bonusMultiplier[category as keyof typeof bonusMultiplier] || 1.1));
          logMessages.push(`🔥 Elemental Mastery bonus for ${category}!`);
        }

        // Apply poison blade effect
        if (prev.adventureSkills.selectedSkill?.type === 'poison_blade') {
          newState.currentEnemy.isPoisoned = true;
          newState.currentEnemy.poisonTurns = 3;
          logMessages.push('☠️ Enemy is poisoned!');
        }

        // Apply vampiric healing
        if (prev.adventureSkills.selectedSkill?.type === 'vampiric') {
          const healing = Math.floor(damage * 0.25);
          newState.playerStats.hp = Math.min(newState.playerStats.maxHp, newState.playerStats.hp + healing);
          logMessages.push(`🩸 Vampiric healing: +${healing} HP`);
        }

        // Apply healing aura
        if (prev.adventureSkills.selectedSkill?.type === 'healing_aura') {
          newState.playerStats.hp = Math.min(newState.playerStats.maxHp, newState.playerStats.hp + 10);
          logMessages.push('✨ Healing Aura: +10 HP');
        }

        // Update ramp stacks
        if (prev.adventureSkills.selectedSkill?.type === 'ramp') {
          newState.adventureSkills.skillEffects.rampActive = true;
        }

        // Update knowledge streak
        let streakMultiplier = 1;
        if (prev.skills.activeMenuSkill?.type === 'knowledge_boost') {
          streakMultiplier = 1.5;
        }
        
        newState.knowledgeStreak.current = Math.floor((prev.knowledgeStreak.current + 1) * streakMultiplier);
        newState.knowledgeStreak.best = Math.max(newState.knowledgeStreak.best, newState.knowledgeStreak.current);
        newState.knowledgeStreak.multiplier = 1 + (newState.knowledgeStreak.current * 0.1);

        newState.currentEnemy.hp -= damage;
        logMessages.push(`You deal ${damage} damage!`);

        // Update statistics
        newState.statistics.correctAnswers += 1;
        newState.statistics.totalDamageDealt += damage;
      } else {
        // Wrong answer - enemy attacks
        let canAvoidDamage = false;
        
        // Check dodge skill
        if (prev.adventureSkills.selectedSkill?.type === 'dodge' && !prev.adventureSkills.skillEffects.dodgeUsed) {
          canAvoidDamage = true;
          newState.adventureSkills.skillEffects.dodgeUsed = true;
          logMessages.push('🛡️ Dodge activated! No damage taken!');
        }
        
        // Check metal shield
        if (prev.adventureSkills.selectedSkill?.type === 'metal_shield' && !prev.adventureSkills.skillEffects.metalShieldUsed) {
          canAvoidDamage = true;
          newState.adventureSkills.skillEffects.metalShieldUsed = true;
          logMessages.push('🛡️ Metal Shield blocks the attack!');
        }
        
        // Check shadow step
        if (prev.adventureSkills.selectedSkill?.type === 'shadow_step' && !prev.adventureSkills.skillEffects.shadowStepUsed) {
          canAvoidDamage = true;
          newState.adventureSkills.skillEffects.shadowStepUsed = true;
          logMessages.push('👤 Shadow Step! Attack avoided!');
        }

        if (!canAvoidDamage) {
          enemyDamage = Math.max(1, prev.currentEnemy.atk - prev.playerStats.def);
          
          // Apply shield wall effect
          if (prev.adventureSkills.selectedSkill?.type === 'shield_wall') {
            enemyDamage = Math.floor(enemyDamage * 0.5);
            logMessages.push('🛡️ Shield Wall reduces damage!');
          }
          
          // Apply defense boost from menu skills
          enemyDamage = applyMenuSkillEffects(enemyDamage, '', 'defense');
          
          newState.playerStats.hp -= enemyDamage;
          logMessages.push(`${prev.currentEnemy.name} deals ${enemyDamage} damage!`);
          
          // Update statistics
          newState.statistics.totalDamageTaken += enemyDamage;
        }

        // Break knowledge streak unless protected
        if (prev.skills.activeMenuSkill?.type !== 'streak_guardian') {
          newState.knowledgeStreak.current = 0;
          newState.knowledgeStreak.multiplier = 1;
        }
      }

      // Apply poison damage to enemy
      if (newState.currentEnemy.isPoisoned && newState.currentEnemy.poisonTurns > 0) {
        const poisonDamage = Math.floor(newState.currentEnemy.maxHp * 0.1);
        newState.currentEnemy.hp -= poisonDamage;
        newState.currentEnemy.poisonTurns -= 1;
        logMessages.push(`☠️ Poison deals ${poisonDamage} damage!`);
        
        if (newState.currentEnemy.poisonTurns <= 0) {
          newState.currentEnemy.isPoisoned = false;
        }
      }

      // Update statistics
      newState.statistics.totalQuestionsAnswered += 1;
      if (category) {
        if (!newState.statistics.accuracyByCategory[category]) {
          newState.statistics.accuracyByCategory[category] = { correct: 0, total: 0 };
        }
        newState.statistics.accuracyByCategory[category].total += 1;
        if (hit) {
          newState.statistics.accuracyByCategory[category].correct += 1;
        }
      }

      // Check if enemy is defeated
      if (newState.currentEnemy.hp <= 0) {
        logMessages.push(`${prev.currentEnemy.name} is defeated!`);
        
        // Apply battle frenzy effect
        if (prev.adventureSkills.selectedSkill?.type === 'battle_frenzy') {
          newState.playerStats.atk = Math.floor(newState.playerStats.atk * 1.25);
          logMessages.push('⚔️ Battle Frenzy! ATK increased!');
        }

        // Calculate rewards
        let coinReward = 50 + (prev.zone * 5);
        let gemReward = 2 + Math.floor(prev.zone / 5);
        
        // Apply knowledge streak multiplier
        coinReward = Math.floor(coinReward * newState.knowledgeStreak.multiplier);
        gemReward = Math.floor(gemReward * newState.knowledgeStreak.multiplier);
        
        // Apply menu skill effects
        coinReward = applyMenuSkillEffects(coinReward, '', 'coins');
        gemReward = applyMenuSkillEffects(gemReward, '', 'gems');

        newState.coins += coinReward;
        newState.gems += gemReward;
        newState.zone += 1;
        newState.inCombat = false;
        newState.currentEnemy = null;
        newState.adventureSkills.selectedSkill = null;
        newState.adventureSkills.showSelectionModal = false;

        // Check for premium status
        if (newState.zone >= 50) {
          newState.isPremium = true;
        }

        // Add merchant fragments every 5 zones
        if (newState.zone % 5 === 0 && newState.zone > newState.merchant.lastFragmentZone) {
          newState.merchant.hugollandFragments += 1;
          newState.merchant.totalFragmentsEarned += 1;
          newState.merchant.lastFragmentZone = newState.zone;
          logMessages.push('🧩 Earned 1 Hugoland Fragment!');
        }

        // Update statistics
        newState.statistics.totalVictories += 1;
        newState.statistics.coinsEarned += coinReward;
        newState.statistics.gemsEarned += gemReward;
        newState.statistics.zonesReached = Math.max(newState.statistics.zonesReached, newState.zone);

        logMessages.push(`Rewards: ${coinReward} coins, ${gemReward} gems`);
      }

      // Check if player is defeated
      if (newState.playerStats.hp <= 0) {
        // Check for phoenix revival
        if (prev.adventureSkills.selectedSkill?.type === 'phoenix' && !prev.adventureSkills.skillEffects.phoenixUsed) {
          newState.playerStats.hp = Math.floor(newState.playerStats.maxHp * 0.5);
          newState.adventureSkills.skillEffects.phoenixUsed = true;
          logMessages.push('🔥 Phoenix revival! Restored to 50% HP!');
        }
        // Check for divine protection
        else if (prev.adventureSkills.selectedSkill?.type === 'divine_protection' && !prev.adventureSkills.skillEffects.divineProtectionUsed) {
          newState.playerStats.hp = 1;
          newState.adventureSkills.skillEffects.divineProtectionUsed = true;
          logMessages.push('✨ Divine Protection! Saved from death!');
        }
        // Check for revival blessing
        else if (prev.skills.activeMenuSkill?.type === 'revival_blessing' && !prev.hasUsedRevival) {
          newState.playerStats.hp = Math.floor(newState.playerStats.maxHp * 0.5);
          newState.hasUsedRevival = true;
          logMessages.push('💖 Revival Blessing activated!');
        }
        // Regular revival check
        else if (!prev.hasUsedRevival) {
          newState.playerStats.hp = Math.floor(newState.playerStats.maxHp * 0.5);
          newState.hasUsedRevival = true;
          logMessages.push('💖 You have been revived with 50% HP!');
        } else {
          // Game over
          logMessages.push('💀 You have been defeated!');
          newState.inCombat = false;
          newState.currentEnemy = null;
          newState.adventureSkills.selectedSkill = null;
          newState.adventureSkills.showSelectionModal = false;
          newState.statistics.totalDeaths += 1;

          // Survival mode
          if (newState.gameMode.current === 'survival') {
            newState.gameMode.survivalLives -= 1;
            if (newState.gameMode.survivalLives <= 0) {
              logMessages.push('💀 All lives lost in Survival mode!');
            }
          }
        }
      }

      // Update combat log
      newState.combatLog = [...prev.combatLog, ...logMessages].slice(-10);

      return newState;
    });
  }, [updateGameState, applyMenuSkillEffects, applyAdventureSkillEffects]);

  const resetGame = useCallback(() => {
    const initialState = createInitialGameState();
    initialState.yojefMarket.items = generateYojefMarketItems();
    setGameState(initialState);
  }, []);

  const setGameMode = useCallback((mode: 'normal' | 'blitz' | 'bloodlust' | 'survival') => {
    updateGameState(prev => ({
      ...prev,
      gameMode: {
        ...prev.gameMode,
        current: mode,
        survivalLives: mode === 'survival' ? 3 : prev.gameMode.survivalLives,
        maxSurvivalLives: mode === 'survival' ? 3 : prev.gameMode.maxSurvivalLives,
      },
    }));
  }, [updateGameState]);

  const toggleCheat = useCallback((cheat: keyof typeof gameState.cheats) => {
    updateGameState(prev => ({
      ...prev,
      cheats: {
        ...prev.cheats,
        [cheat]: !prev.cheats[cheat],
      },
    }));
  }, [updateGameState]);

  const generateCheatItem = useCallback(() => {
    // Implementation for cheat item generation
  }, []);

  const mineGem = useCallback((x: number, y: number): { gems: number; shinyGems: number } | null => {
    if (!gameState) return null;

    const isShiny = gameState.skills.activeMenuSkill?.type === 'luck_gem' || Math.random() < 0.05;
    let gemsGained = isShiny ? 0 : 1;
    let shinyGemsGained = isShiny ? 1 : 0;

    // Apply gem multiplier effects
    gemsGained = applyMenuSkillEffects(gemsGained, '', 'gems');
    shinyGemsGained = applyMenuSkillEffects(shinyGemsGained, '', 'gems');

    updateGameState(prev => ({
      ...prev,
      gems: prev.gems + gemsGained,
      shinyGems: prev.shinyGems + shinyGemsGained,
      mining: {
        ...prev.mining,
        totalGemsMined: prev.mining.totalGemsMined + gemsGained,
        totalShinyGemsMined: prev.mining.totalShinyGemsMined + shinyGemsGained,
      },
      statistics: {
        ...prev.statistics,
        gemsEarned: prev.statistics.gemsEarned + gemsGained,
        shinyGemsEarned: prev.statistics.shinyGemsEarned + shinyGemsGained,
      },
    }));

    return { gems: gemsGained, shinyGems: shinyGemsGained };
  }, [gameState, updateGameState]);

  const exchangeShinyGems = useCallback((amount: number): boolean => {
    if (!gameState || gameState.shinyGems < amount) return false;

    const regularGems = amount * 10;

    updateGameState(prev => ({
      ...prev,
      shinyGems: prev.shinyGems - amount,
      gems: prev.gems + regularGems,
      statistics: {
        ...prev.statistics,
        gemsEarned: prev.statistics.gemsEarned + regularGems,
      },
    }));

    return true;
  }, [gameState, updateGameState]);

  const purchaseRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;

    const relic = gameState.yojefMarket.items.find(item => item.id === relicId);
    if (!relic || gameState.gems < relic.cost) return false;

    updateGameState(prev => ({
      ...prev,
      gems: prev.gems - relic.cost,
      inventory: {
        ...prev.inventory,
        relics: [...prev.inventory.relics, relic],
      },
      yojefMarket: {
        ...prev.yojefMarket,
        items: prev.yojefMarket.items.filter(item => item.id !== relicId),
      },
    }));

    return true;
  }, [gameState, updateGameState]);

  const upgradeRelic = useCallback((relicId: string) => {
    updateGameState(prev => {
      const relic = prev.inventory.relics.find(r => r.id === relicId) || 
                   prev.inventory.equippedRelics.find(r => r.id === relicId);
      if (!relic || prev.gems < relic.upgradeCost) return prev;

      const updatedRelics = prev.inventory.relics.map(r =>
        r.id === relicId
          ? {
              ...r,
              level: r.level + 1,
              baseAtk: r.baseAtk ? r.baseAtk + 22 : undefined,
              baseDef: r.baseDef ? r.baseDef + 15 : undefined,
              upgradeCost: Math.floor(r.upgradeCost * 1.5),
            }
          : r
      );

      const updatedEquippedRelics = prev.inventory.equippedRelics.map(r =>
        r.id === relicId
          ? {
              ...r,
              level: r.level + 1,
              baseAtk: r.baseAtk ? r.baseAtk + 22 : undefined,
              baseDef: r.baseDef ? r.baseDef + 15 : undefined,
              upgradeCost: Math.floor(r.upgradeCost * 1.5),
            }
          : r
      );

      return {
        ...prev,
        gems: prev.gems - relic.upgradeCost,
        inventory: {
          ...prev.inventory,
          relics: updatedRelics,
          equippedRelics: updatedEquippedRelics,
        },
      };
    });
  }, [updateGameState]);

  const equipRelic = useCallback((relicId: string) => {
    updateGameState(prev => {
      const relic = prev.inventory.relics.find(r => r.id === relicId);
      if (!relic) return prev;

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          relics: prev.inventory.relics.filter(r => r.id !== relicId),
          equippedRelics: [...prev.inventory.equippedRelics, relic],
        },
      };
    });
  }, [updateGameState]);

  const unequipRelic = useCallback((relicId: string) => {
    updateGameState(prev => {
      const relic = prev.inventory.equippedRelics.find(r => r.id === relicId);
      if (!relic) return prev;

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          equippedRelics: prev.inventory.equippedRelics.filter(r => r.id !== relicId),
          relics: [...prev.inventory.relics, relic],
        },
      };
    });
  }, [updateGameState]);

  const sellRelic = useCallback((relicId: string) => {
    updateGameState(prev => {
      const relic = prev.inventory.relics.find(r => r.id === relicId);
      if (!relic) return prev;

      const sellPrice = Math.floor(relic.cost * 0.5);

      return {
        ...prev,
        gems: prev.gems + sellPrice,
        inventory: {
          ...prev.inventory,
          relics: prev.inventory.relics.filter(r => r.id !== relicId),
        },
      };
    });
  }, [updateGameState]);

  const claimDailyReward = useCallback((): boolean => {
    if (!gameState?.dailyRewards.availableReward) return false;

    const reward = gameState.dailyRewards.availableReward;

    updateGameState(prev => {
      const now = new Date();
      const newRewardHistory = [...prev.dailyRewards.rewardHistory, { ...reward, claimed: true, claimDate: now }];

      return {
        ...prev,
        coins: prev.coins + reward.coins,
        gems: prev.gems + reward.gems,
        dailyRewards: {
          ...prev.dailyRewards,
          lastClaimDate: now,
          currentStreak: prev.dailyRewards.currentStreak + 1,
          maxStreak: Math.max(prev.dailyRewards.maxStreak, prev.dailyRewards.currentStreak + 1),
          availableReward: null,
          rewardHistory: newRewardHistory,
        },
      };
    });

    return true;
  }, [gameState, updateGameState]);

  const upgradeSkill = useCallback((skillId: string): boolean => {
    if (!gameState) return false;

    const skillCosts = {
      combat_mastery: 1,
      knowledge_boost: 2,
      treasure_hunter: 2,
      durability_expert: 3,
      streak_master: 3,
      health_regeneration: 4,
    };

    const cost = skillCosts[skillId as keyof typeof skillCosts] || 1;
    if (gameState.progression.skillPoints < cost) return false;

    updateGameState(prev => ({
      ...prev,
      progression: {
        ...prev.progression,
        skillPoints: prev.progression.skillPoints - cost,
        unlockedSkills: [...prev.progression.unlockedSkills, skillId],
      },
    }));

    return true;
  }, [gameState, updateGameState]);

  const prestige = useCallback((): boolean => {
    if (!gameState || gameState.progression.level < 50) return false;

    const prestigePoints = Math.floor(gameState.progression.level / 10);

    updateGameState(prev => ({
      ...prev,
      progression: {
        ...prev.progression,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        skillPoints: 0,
        unlockedSkills: [],
        prestigeLevel: prev.progression.prestigeLevel + 1,
        prestigePoints: prev.progression.prestigePoints + prestigePoints,
      },
    }));

    return true;
  }, [gameState, updateGameState]);

  const claimOfflineRewards = useCallback(() => {
    updateGameState(prev => ({
      ...prev,
      coins: prev.coins + prev.offlineProgress.offlineCoins,
      gems: prev.gems + prev.offlineProgress.offlineGems,
      offlineProgress: {
        ...prev.offlineProgress,
        offlineCoins: 0,
        offlineGems: 0,
        offlineTime: 0,
      },
    }));
  }, [updateGameState]);

  const bulkSell = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(prev => {
      let totalValue = 0;
      let itemsSold = 0;

      if (type === 'weapon') {
        const itemsToSell = prev.inventory.weapons.filter(w => 
          itemIds.includes(w.id) && prev.inventory.currentWeapon?.id !== w.id
        );
        
        totalValue = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        itemsSold = itemsToSell.length;

        return {
          ...prev,
          coins: prev.coins + totalValue,
          inventory: {
            ...prev.inventory,
            weapons: prev.inventory.weapons.filter(w => !itemIds.includes(w.id) || prev.inventory.currentWeapon?.id === w.id),
          },
          statistics: {
            ...prev.statistics,
            itemsSold: prev.statistics.itemsSold + itemsSold,
            coinsEarned: prev.statistics.coinsEarned + totalValue,
          },
        };
      } else {
        const itemsToSell = prev.inventory.armor.filter(a => 
          itemIds.includes(a.id) && prev.inventory.currentArmor?.id !== a.id
        );
        
        totalValue = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        itemsSold = itemsToSell.length;

        return {
          ...prev,
          coins: prev.coins + totalValue,
          inventory: {
            ...prev.inventory,
            armor: prev.inventory.armor.filter(a => !itemIds.includes(a.id) || prev.inventory.currentArmor?.id === a.id),
          },
          statistics: {
            ...prev.statistics,
            itemsSold: prev.statistics.itemsSold + itemsSold,
            coinsEarned: prev.statistics.coinsEarned + totalValue,
          },
        };
      }
    });
  }, [updateGameState]);

  const bulkUpgrade = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(prev => {
      let totalCost = 0;
      let itemsUpgraded = 0;

      if (type === 'weapon') {
        const itemsToUpgrade = prev.inventory.weapons.filter(w => itemIds.includes(w.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);
        
        if (prev.gems < totalCost) return prev;

        const updatedWeapons = prev.inventory.weapons.map(w =>
          itemIds.includes(w.id)
            ? { ...w, level: w.level + 1, baseAtk: w.baseAtk + 10, upgradeCost: Math.floor(w.upgradeCost * 1.5) }
            : w
        );

        itemsUpgraded = itemsToUpgrade.length;

        return {
          ...prev,
          gems: prev.gems - totalCost,
          inventory: {
            ...prev.inventory,
            weapons: updatedWeapons,
            currentWeapon: prev.inventory.currentWeapon && itemIds.includes(prev.inventory.currentWeapon.id)
              ? updatedWeapons.find(w => w.id === prev.inventory.currentWeapon!.id) || prev.inventory.currentWeapon
              : prev.inventory.currentWeapon,
          },
          statistics: {
            ...prev.statistics,
            itemsUpgraded: prev.statistics.itemsUpgraded + itemsUpgraded,
          },
        };
      } else {
        const itemsToUpgrade = prev.inventory.armor.filter(a => itemIds.includes(a.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);
        
        if (prev.gems < totalCost) return prev;

        const updatedArmor = prev.inventory.armor.map(a =>
          itemIds.includes(a.id)
            ? { ...a, level: a.level + 1, baseDef: a.baseDef + 5, upgradeCost: Math.floor(a.upgradeCost * 1.5) }
            : a
        );

        itemsUpgraded = itemsToUpgrade.length;

        return {
          ...prev,
          gems: prev.gems - totalCost,
          inventory: {
            ...prev.inventory,
            armor: updatedArmor,
            currentArmor: prev.inventory.currentArmor && itemIds.includes(prev.inventory.currentArmor.id)
              ? updatedArmor.find(a => a.id === prev.inventory.currentArmor!.id) || prev.inventory.currentArmor
              : prev.inventory.currentArmor,
          },
          statistics: {
            ...prev.statistics,
            itemsUpgraded: prev.statistics.itemsUpgraded + itemsUpgraded,
          },
        };
      }
    });
  }, [updateGameState]);

  const plantSeed = useCallback((): boolean => {
    if (!gameState || gameState.coins < gameState.gardenOfGrowth.seedCost || gameState.gardenOfGrowth.isPlanted) {
      return false;
    }

    updateGameState(prev => ({
      ...prev,
      coins: prev.coins - prev.gardenOfGrowth.seedCost,
      gardenOfGrowth: {
        ...prev.gardenOfGrowth,
        isPlanted: true,
        plantedAt: new Date(),
        lastWatered: new Date(),
        waterHoursRemaining: 24,
      },
    }));

    return true;
  }, [gameState, updateGameState]);

  const buyWater = useCallback((hours: number): boolean => {
    if (!gameState) return false;

    const cost = Math.floor((hours / 24) * gameState.gardenOfGrowth.waterCost);
    if (gameState.coins < cost) return false;

    updateGameState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      gardenOfGrowth: {
        ...prev.gardenOfGrowth,
        waterHoursRemaining: prev.gardenOfGrowth.waterHoursRemaining + hours,
        lastWatered: new Date(),
      },
    }));

    return true;
  }, [gameState, updateGameState]);

  const updateSettings = useCallback((newSettings: Partial<typeof gameState.settings>) => {
    updateGameState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  }, [updateGameState]);

  const addCoins = useCallback((amount: number) => {
    updateGameState(prev => ({
      ...prev,
      coins: prev.coins + amount,
    }));
  }, [updateGameState]);

  const addGems = useCallback((amount: number) => {
    updateGameState(prev => ({
      ...prev,
      gems: prev.gems + amount,
    }));
  }, [updateGameState]);

  const teleportToZone = useCallback((zone: number) => {
    updateGameState(prev => ({
      ...prev,
      zone: Math.max(1, zone),
    }));
  }, [updateGameState]);

  const setExperience = useCallback((xp: number) => {
    updateGameState(prev => ({
      ...prev,
      progression: {
        ...prev.progression,
        experience: Math.max(0, xp),
      },
    }));
  }, [updateGameState]);

  const rollSkill = useCallback((): boolean => {
    if (!gameState || gameState.coins < 100) return false;

    const newSkill = generateMenuSkill();

    updateGameState(prev => ({
      ...prev,
      coins: prev.coins - 100,
      skills: {
        ...prev.skills,
        activeMenuSkill: newSkill,
        lastRollTime: new Date(),
      },
    }));

    return true;
  }, [gameState, updateGameState]);

  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    updateGameState(prev => ({
      ...prev,
      adventureSkills: {
        ...prev.adventureSkills,
        selectedSkill: skill,
        showSelectionModal: false,
        skillEffects: {
          ...prev.adventureSkills.skillEffects,
          truthLiesActive: skill.type === 'truth_lies',
          lightningChainActive: skill.type === 'lightning_chain',
          rampActive: skill.type === 'ramp',
          berserkerActive: skill.type === 'berserker',
          vampiricActive: skill.type === 'vampiric',
          timeSlowActive: skill.type === 'time_slow',
          criticalStrikeActive: skill.type === 'critical_strike',
          shieldWallActive: skill.type === 'shield_wall',
          poisonBladeActive: skill.type === 'poison_blade',
          arcaneShieldActive: skill.type === 'arcane_shield',
          battleFrenzyActive: skill.type === 'battle_frenzy',
          elementalMasteryActive: skill.type === 'elemental_mastery',
          healingAuraActive: skill.type === 'healing_aura',
          doubleStrikeActive: skill.type === 'double_strike',
          manaShieldActive: skill.type === 'mana_shield',
          berserkRageActive: skill.type === 'berserk_rage',
          stormCallActive: skill.type === 'storm_call',
          bloodPactActive: skill.type === 'blood_pact',
          frostArmorActive: skill.type === 'frost_armor',
          fireballActive: skill.type === 'fireball',
        },
      },
    }));
  }, [updateGameState]);

  const skipAdventureSkills = useCallback(() => {
    updateGameState(prev => ({
      ...prev,
      adventureSkills: {
        ...prev.adventureSkills,
        selectedSkill: null,
        showSelectionModal: false,
      },
    }));
  }, [updateGameState]);

  const useSkipCard = useCallback(() => {
    updateGameState(prev => ({
      ...prev,
      adventureSkills: {
        ...prev.adventureSkills,
        skillEffects: {
          ...prev.adventureSkills.skillEffects,
          skipCardUsed: true,
        },
      },
    }));
  }, [updateGameState]);

  const spendFragments = useCallback((): boolean => {
    if (!gameState || gameState.merchant.hugollandFragments < 5) return false;

    // Generate 3 random rewards
    const rewards: MerchantReward[] = [];
    for (let i = 0; i < 3; i++) {
      const rewardTypes = ['item', 'coins', 'gems', 'xp', 'health', 'attack', 'skill'];
      const randomType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)] as MerchantReward['type'];
      
      let reward: MerchantReward = {
        id: Math.random().toString(36).substr(2, 9),
        type: randomType,
        name: '',
        description: '',
        icon: '',
      };

      switch (randomType) {
        case 'item':
          const isWeapon = Math.random() < 0.5;
          const item = isWeapon ? generateWeapon(false, 'legendary', true) : generateArmor(false, 'legendary', true);
          reward = {
            ...reward,
            name: `Legendary ${isWeapon ? 'Weapon' : 'Armor'}`,
            description: `A powerful ${item.name}`,
            icon: isWeapon ? '⚔️' : '🛡️',
            item,
          };
          break;
        case 'coins':
          const coinAmount = 5000 + Math.floor(Math.random() * 10000);
          reward = {
            ...reward,
            name: 'Coin Treasure',
            description: `${coinAmount.toLocaleString()} coins`,
            icon: '💰',
            coins: coinAmount,
          };
          break;
        case 'gems':
          const gemAmount = 500 + Math.floor(Math.random() * 1000);
          reward = {
            ...reward,
            name: 'Gem Cache',
            description: `${gemAmount.toLocaleString()} gems`,
            icon: '💎',
            gems: gemAmount,
          };
          break;
        case 'xp':
          const xpAmount = 1000 + Math.floor(Math.random() * 2000);
          reward = {
            ...reward,
            name: 'Experience Tome',
            description: `${xpAmount.toLocaleString()} experience points`,
            icon: '📚',
            xp: xpAmount,
          };
          break;
        case 'health':
          reward = {
            ...reward,
            name: 'Vitality Boost',
            description: 'Permanently increase max HP by 50%',
            icon: '❤️',
            healthMultiplier: 1.5,
          };
          break;
        case 'attack':
          reward = {
            ...reward,
            name: 'Power Enhancement',
            description: 'Permanently increase ATK by 25%',
            icon: '⚔️',
            attackMultiplier: 1.25,
          };
          break;
        case 'skill':
          const freeSkill = generateMenuSkill();
          reward = {
            ...reward,
            name: 'Free Menu Skill',
            description: `Get ${freeSkill.name} for free`,
            icon: '✨',
            skill: freeSkill,
          };
          break;
      }

      rewards.push(reward);
    }

    updateGameState(prev => ({
      ...prev,
      merchant: {
        ...prev.merchant,
        hugollandFragments: prev.merchant.hugollandFragments - 5,
        showRewardModal: true,
        availableRewards: rewards,
      },
    }));

    return true;
  }, [gameState, updateGameState]);

  const selectMerchantReward = useCallback((reward: MerchantReward) => {
    updateGameState(prev => {
      let newState = { ...prev };

      switch (reward.type) {
        case 'item':
          if (reward.item) {
            if ('baseAtk' in reward.item) {
              newState.inventory.weapons.push(reward.item as Weapon);
            } else if ('baseDef' in reward.item) {
              newState.inventory.armor.push(reward.item as Armor);
            } else {
              newState.inventory.relics.push(reward.item as RelicItem);
            }
          }
          break;
        case 'coins':
          if (reward.coins) {
            newState.coins += reward.coins;
          }
          break;
        case 'gems':
          if (reward.gems) {
            newState.gems += reward.gems;
          }
          break;
        case 'xp':
          if (reward.xp) {
            newState.progression.experience += reward.xp;
          }
          break;
        case 'health':
          if (reward.healthMultiplier) {
            newState.playerStats.maxHp = Math.floor(newState.playerStats.maxHp * reward.healthMultiplier);
            newState.playerStats.hp = newState.playerStats.maxHp;
          }
          break;
        case 'attack':
          if (reward.attackMultiplier) {
            newState.playerStats.atk = Math.floor(newState.playerStats.atk * reward.attackMultiplier);
          }
          break;
        case 'skill':
          if (reward.skill) {
            newState.skills.activeMenuSkill = reward.skill;
          }
          break;
      }

      newState.merchant.showRewardModal = false;
      newState.merchant.availableRewards = [];

      return newState;
    });
  }, [updateGameState]);

  // Calculate player stats with all bonuses
  const calculatePlayerStats = useCallback(() => {
    if (!gameState) return null;

    let baseAtk = gameState.playerStats.baseAtk;
    let baseDef = gameState.playerStats.baseDef;
    let baseHp = gameState.playerStats.baseHp;

    // Add weapon stats
    if (gameState.inventory.currentWeapon) {
      const weapon = gameState.inventory.currentWeapon;
      const durabilityMultiplier = weapon.durability / weapon.maxDurability;
      baseAtk += Math.floor((weapon.baseAtk + (weapon.level - 1) * 10) * durabilityMultiplier);
    }

    // Add armor stats
    if (gameState.inventory.currentArmor) {
      const armor = gameState.inventory.currentArmor;
      const durabilityMultiplier = armor.durability / armor.maxDurability;
      baseDef += Math.floor((armor.baseDef + (armor.level - 1) * 5) * durabilityMultiplier);
    }

    // Add relic stats
    gameState.inventory.equippedRelics.forEach(relic => {
      if (relic.baseAtk) {
        baseAtk += relic.baseAtk + (relic.level - 1) * 22;
      }
      if (relic.baseDef) {
        baseDef += relic.baseDef + (relic.level - 1) * 15;
      }
    });

    // Add research bonuses
    baseAtk += gameState.research.bonuses.atk;
    baseDef += gameState.research.bonuses.def;
    baseHp += gameState.research.bonuses.hp;

    // Add garden bonuses
    const gardenBonus = gameState.gardenOfGrowth.totalGrowthBonus / 100;
    baseAtk = Math.floor(baseAtk * (1 + gardenBonus));
    baseDef = Math.floor(baseDef * (1 + gardenBonus));
    baseHp = Math.floor(baseHp * (1 + gardenBonus));

    // Apply menu skill effects
    baseAtk = applyMenuSkillEffects(baseAtk, '', 'atk');
    baseDef = applyMenuSkillEffects(baseDef, '', 'def');
    baseHp = applyMenuSkillEffects(baseHp, '', 'maxHp');

    // Apply adventure skill effects
    baseAtk = applyAdventureSkillEffects(baseAtk, 'atk');

    return {
      ...gameState.playerStats,
      atk: baseAtk,
      def: baseDef,
      maxHp: baseHp,
      hp: Math.min(gameState.playerStats.hp, baseHp),
    };
  }, [gameState, applyMenuSkillEffects, applyAdventureSkillEffects]);

  // Update player stats when they change
  useEffect(() => {
    if (gameState) {
      const newStats = calculatePlayerStats();
      if (newStats && (
        newStats.atk !== gameState.playerStats.atk ||
        newStats.def !== gameState.playerStats.def ||
        newStats.maxHp !== gameState.playerStats.maxHp
      )) {
        updateGameState(prev => ({
          ...prev,
          playerStats: newStats,
        }));
      }
    }
  }, [gameState?.inventory.currentWeapon, gameState?.inventory.currentArmor, gameState?.inventory.equippedRelics, gameState?.research.bonuses, gameState?.gardenOfGrowth.totalGrowthBonus, gameState?.skills.activeMenuSkill, gameState?.adventureSkills.selectedSkill]);

  return {
    gameState,
    isLoading,
    equipWeapon,
    equipArmor,
    upgradeWeapon,
    upgradeArmor,
    sellWeapon,
    sellArmor,
    openChest,
    discardItem,
    purchaseMythical,
    startCombat,
    attack,
    resetGame,
    setGameMode,
    toggleCheat,
    generateCheatItem,
    mineGem,
    exchangeShinyGems,
    purchaseRelic,
    upgradeRelic,
    equipRelic,
    unequipRelic,
    sellRelic,
    claimDailyReward,
    upgradeSkill,
    prestige,
    claimOfflineRewards,
    bulkSell,
    bulkUpgrade,
    plantSeed,
    buyWater,
    updateSettings,
    addCoins,
    addGems,
    teleportToZone,
    setExperience,
    rollSkill,
    selectAdventureSkill,
    skipAdventureSkills,
    useSkipCard,
    spendFragments,
    selectMerchantReward,
  };
};

export default useGameState;