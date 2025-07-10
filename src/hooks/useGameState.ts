import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, Enemy, ChestReward, RelicItem, AdventureSkill, MerchantReward } from '../types/game';
import { generateWeapon, generateArmor, generateEnemy, getChestRarityWeights, generateRelicItem } from '../utils/gameUtils';
import { checkAchievements, initializeAchievements } from '../utils/achievements';
import { checkPlayerTags, initializePlayerTags } from '../utils/playerTags';
import AsyncStorage from '../utils/storage';

const STORAGE_KEY = 'hugoland_game_state';

const createInitialGameState = (): GameState => ({
  coins: 500,
  gems: 50,
  shinyGems: 0,
  zone: 1,
  playerStats: {
    hp: 300,
    maxHp: 300,
    atk: 50,
    def: 20,
    baseAtk: 50,
    baseDef: 20,
    baseHp: 300
  },
  inventory: {
    weapons: [],
    armor: [],
    relics: [],
    currentWeapon: null,
    currentArmor: null,
    equippedRelics: []
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
      mythical: 0
    }
  },
  knowledgeStreak: {
    current: 0,
    best: 0,
    multiplier: 1
  },
  gameMode: {
    current: 'normal',
    speedModeActive: false
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
    revivals: 0
  },
  cheats: {
    infiniteCoins: false,
    infiniteGems: false,
    obtainAnyItem: false
  },
  mining: {
    totalGemsMined: 0,
    totalShinyGemsMined: 0
  },
  yojefMarket: {
    items: [],
    lastRefresh: new Date(),
    nextRefresh: new Date(Date.now() + 5 * 60 * 1000)
  },
  playerTags: initializePlayerTags(),
  dailyRewards: {
    lastClaimDate: null,
    currentStreak: 0,
    maxStreak: 0,
    availableReward: null,
    rewardHistory: []
  },
  progression: {
    unlockedSkills: [],
    prestigeLevel: 0,
    prestigePoints: 0,
    masteryLevels: {}
  },
  offlineProgress: {
    lastSaveTime: new Date(),
    offlineCoins: 0,
    offlineGems: 0,
    offlineTime: 0,
    maxOfflineHours: 24
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
    maxGrowthCm: 100
  },
  settings: {
    colorblindMode: false,
    darkMode: true,
    language: 'en',
    notifications: true,
    snapToGrid: false,
    beautyMode: false
  },
  hasUsedRevival: false,
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
      fireballActive: false
    }
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
      xpMultiplier: 1
    }
  },
  multipliers: {
    coins: 1,
    gems: 1,
    atk: 1,
    def: 1,
    hp: 1
  },
  merchant: {
    hugollandFragments: 0,
    totalFragmentsEarned: 0,
    lastFragmentZone: 0,
    showRewardModal: false,
    availableRewards: []
  }
});

// Adventure Skills - 10 working skills
const adventureSkillDefinitions: Omit<AdventureSkill, 'id'>[] = [
  {
    name: 'Ramp',
    description: 'Each correct answer increases damage by 20% (stacks)',
    type: 'ramp'
  },
  {
    name: 'Lightning Chain',
    description: 'Correct answers deal 50% more damage',
    type: 'lightning_chain'
  },
  {
    name: 'Skip Card',
    description: 'Skip one question and automatically get it correct',
    type: 'skip_card'
  },
  {
    name: 'Metal Shield',
    description: 'Take 50% less damage from enemies',
    type: 'metal_shield'
  },
  {
    name: 'Truth & Lies',
    description: 'Remove one wrong answer from multiple choice questions',
    type: 'truth_lies'
  },
  {
    name: 'Berserker',
    description: 'Deal 100% more damage but take 25% more damage',
    type: 'berserker'
  },
  {
    name: 'Vampiric',
    description: 'Heal 25% of damage dealt to enemies',
    type: 'vampiric'
  },
  {
    name: 'Time Slow',
    description: 'Get 50% more time to answer questions',
    type: 'time_slow'
  },
  {
    name: 'Critical Strike',
    description: '25% chance to deal double damage',
    type: 'critical_strike'
  },
  {
    name: 'Healing Aura',
    description: 'Heal 10 HP after each correct answer',
    type: 'healing_aura'
  }
];

const generateAdventureSkills = (): AdventureSkill[] => {
  // Shuffle and pick 3 random skills
  const shuffled = [...adventureSkillDefinitions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((skill, index) => ({
    ...skill,
    id: `skill_${index}_${Date.now()}`
  }));
};

const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [correctAnswersThisCombat, setCorrectAnswersThisCombat] = useState(0);

  // Load game state from storage
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Ensure base HP is 300
          if (parsedState.playerStats.baseHp !== 300) {
            parsedState.playerStats.baseHp = 300;
            parsedState.playerStats.maxHp = 300;
            parsedState.playerStats.hp = Math.min(parsedState.playerStats.hp, 300);
          }
          
          // Ensure Yojef Market has 2 items
          if (!parsedState.yojefMarket) {
            parsedState.yojefMarket = {
              items: [],
              lastRefresh: new Date(),
              nextRefresh: new Date(Date.now() + 5 * 60 * 1000)
            };
          }
          
          // Ensure exactly 2 items in market
          while (parsedState.yojefMarket.items.length < 2) {
            parsedState.yojefMarket.items.push(generateRelicItem());
          }
          if (parsedState.yojefMarket.items.length > 2) {
            parsedState.yojefMarket.items = parsedState.yojefMarket.items.slice(0, 2);
          }
          
          setGameState(parsedState);
        } else {
          const initialState = createInitialGameState();
          // Fill initial market with 2 relics (1 weapon, 1 armor)
          initialState.yojefMarket.items = [
            generateRelicItem('weapon'),
            generateRelicItem('armor')
          ];
          while (initialState.yojefMarket.items.length < 2) {
            initialState.yojefMarket.items.push(generateRelicItem());
          }
          setGameState(initialState);
        }
      } catch (error) {
        console.error('Error loading game state:', error);
        const initialState = createInitialGameState();
        // Fill initial market with 2 relics
        while (initialState.yojefMarket.items.length < 2) {
          initialState.yojefMarket.items.push(generateRelicItem());
        }
        setGameState(initialState);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameState();
  }, []);

  // Save game state to storage
  const saveGameState = useCallback(async (state: GameState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }, []);

  // Auto-save when game state changes
  useEffect(() => {
    if (gameState && !isLoading) {
      saveGameState(gameState);
    }
  }, [gameState, isLoading, saveGameState]);

  const startCombat = useCallback(() => {
    if (!gameState) return;

    const enemy = generateEnemy(gameState.zone);
    const availableSkills = generateAdventureSkills();
    
    setCorrectAnswersThisCombat(0);
    setGameState(prev => prev ? {
      ...prev,
      currentEnemy: enemy,
      inCombat: true,
      combatLog: [`You encounter ${enemy.name} in Zone ${gameState.zone}!`],
      adventureSkills: {
        ...prev.adventureSkills,
        availableSkills,
        showSelectionModal: true,
        selectedSkill: null,
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
          fireballActive: false
        }
      }
    } : prev);
  }, [gameState]);

  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    setGameState(prev => prev ? {
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
          healingAuraActive: skill.type === 'healing_aura'
        }
      }
    } : prev);
  }, []);

  const skipAdventureSkills = useCallback(() => {
    setGameState(prev => prev ? {
      ...prev,
      adventureSkills: {
        ...prev.adventureSkills,
        showSelectionModal: false,
        selectedSkill: null
      }
    } : prev);
  }, []);

  const useSkipCard = useCallback(() => {
    setGameState(prev => prev ? {
      ...prev,
      adventureSkills: {
        ...prev.adventureSkills,
        skillEffects: {
          ...prev.adventureSkills.skillEffects,
          skipCardUsed: true
        }
      }
    } : prev);
  }, []);

  const attack = useCallback((hit: boolean, category?: string) => {
    if (!gameState || !gameState.currentEnemy) return;

    setGameState(prev => {
      if (!prev || !prev.currentEnemy) return prev;

      let newState = { ...prev };
      const enemy = { ...prev.currentEnemy };
      const playerStats = { ...prev.playerStats };
      const combatLog = [...prev.combatLog];
      let newCorrectAnswers = correctAnswersThisCombat;

      if (hit) {
        newCorrectAnswers++;
        
        // Calculate base damage
        let damage = Math.max(1, playerStats.atk - enemy.def);
        
        // Apply adventure skill effects
        if (prev.adventureSkills.skillEffects.lightningChainActive) {
          damage = Math.floor(damage * 1.5);
        }
        
        if (prev.adventureSkills.skillEffects.rampActive) {
          damage = Math.floor(damage * (1 + (newCorrectAnswers - 1) * 0.2));
        }
        
        if (prev.adventureSkills.skillEffects.berserkerActive) {
          damage = Math.floor(damage * 2);
        }
        
        if (prev.adventureSkills.skillEffects.criticalStrikeActive && Math.random() < 0.25) {
          damage *= 2;
          combatLog.push('Critical strike!');
        }
        
        enemy.hp = Math.max(0, enemy.hp - damage);
        combatLog.push(`You deal ${damage} damage to ${enemy.name}!`);
        
        // Vampiric healing
        if (prev.adventureSkills.skillEffects.vampiricActive) {
          const healing = Math.floor(damage * 0.25);
          playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + healing);
          combatLog.push(`You heal ${healing} HP from vampiric effect!`);
        }
        
        // Healing Aura
        if (prev.adventureSkills.skillEffects.healingAuraActive) {
          playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 10);
          combatLog.push('You heal 10 HP from healing aura!');
        }
        
        // Update knowledge streak
        newState.knowledgeStreak = {
          ...prev.knowledgeStreak,
          current: prev.knowledgeStreak.current + 1,
          best: Math.max(prev.knowledgeStreak.best, prev.knowledgeStreak.current + 1),
          multiplier: 1 + Math.floor((prev.knowledgeStreak.current + 1) / 5) * 0.1
        };
        
        // Update statistics
        newState.statistics = {
          ...prev.statistics,
          correctAnswers: prev.statistics.correctAnswers + 1,
          totalQuestionsAnswered: prev.statistics.totalQuestionsAnswered + 1
        };
        
        if (category) {
          const categoryStats = prev.statistics.accuracyByCategory[category] || { correct: 0, total: 0 };
          newState.statistics.accuracyByCategory = {
            ...prev.statistics.accuracyByCategory,
            [category]: {
              correct: categoryStats.correct + 1,
              total: categoryStats.total + 1
            }
          };
        }
      } else {
        // Wrong answer - enemy attacks
        let enemyDamage = Math.max(1, enemy.atk - playerStats.def);
        
        // Apply adventure skill effects
        if (prev.adventureSkills.skillEffects.berserkerActive) {
          enemyDamage = Math.floor(enemyDamage * 1.25);
        }
        
        if (prev.adventureSkills.skillEffects.metalShieldUsed) {
          enemyDamage = Math.floor(enemyDamage * 0.5);
        }
        
        playerStats.hp = Math.max(0, playerStats.hp - enemyDamage);
        combatLog.push(`${enemy.name} deals ${enemyDamage} damage to you!`);
        
        // Reset knowledge streak
        newState.knowledgeStreak = {
          ...prev.knowledgeStreak,
          current: 0,
          multiplier: 1
        };
        
        // Update statistics
        newState.statistics = {
          ...prev.statistics,
          totalQuestionsAnswered: prev.statistics.totalQuestionsAnswered + 1
        };
        
        if (category) {
          const categoryStats = prev.statistics.accuracyByCategory[category] || { correct: 0, total: 0 };
          newState.statistics.accuracyByCategory = {
            ...prev.statistics.accuracyByCategory,
            [category]: {
              ...categoryStats,
              total: categoryStats.total + 1
            }
          };
        }
      }

      // Check if enemy is defeated
      if (enemy.hp <= 0) {
        // Calculate coins using new formula: correct answers * (HP * 100 / 300)
        const coinReward = Math.ceil(newCorrectAnswers * (playerStats.hp * 100 / 300));
        const gemReward = Math.floor(Math.random() * 3) + 1;
        
        newState.coins += coinReward;
        newState.gems += gemReward;
        newState.zone += 1;
        
        combatLog.push(`${enemy.name} defeated!`);
        combatLog.push(`You earned ${coinReward} coins and ${gemReward} gems!`);
        
        // Update statistics
        newState.statistics = {
          ...newState.statistics,
          totalVictories: prev.statistics.totalVictories + 1,
          coinsEarned: prev.statistics.coinsEarned + coinReward,
          gemsEarned: prev.statistics.gemsEarned + gemReward,
          zonesReached: Math.max(prev.statistics.zonesReached, newState.zone)
        };
        
        // Check for premium unlock
        if (newState.zone >= 50) {
          newState.isPremium = true;
        }
        
        // Add Hugoland Fragments every 5 zones
        if (newState.zone % 5 === 0 && newState.zone > newState.merchant.lastFragmentZone) {
          newState.merchant = {
            ...newState.merchant,
            hugollandFragments: newState.merchant.hugollandFragments + 1,
            totalFragmentsEarned: newState.merchant.totalFragmentsEarned + 1,
            lastFragmentZone: newState.zone
          };
          combatLog.push('You found a Hugoland Fragment!');
        }
        
        // End combat
        newState.currentEnemy = null;
        newState.inCombat = false;
        newState.hasUsedRevival = false;
        
        // Reset adventure skills
        newState.adventureSkills = {
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
            fireballActive: false
          }
        };
      }
      
      // Check if player is defeated
      if (playerStats.hp <= 0 && !prev.hasUsedRevival) {
        playerStats.hp = playerStats.maxHp;
        newState.hasUsedRevival = true;
        combatLog.push('You have been revived!');
      } else if (playerStats.hp <= 0) {
        // Game over
        combatLog.push('You have been defeated!');
        newState.currentEnemy = null;
        newState.inCombat = false;
        newState.hasUsedRevival = false;
        
        // Reset adventure skills
        newState.adventureSkills = {
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
            fireballActive: false
          }
        };
        
        newState.statistics = {
          ...newState.statistics,
          totalDeaths: prev.statistics.totalDeaths + 1
        };
      }

      newState.currentEnemy = enemy;
      newState.playerStats = playerStats;
      newState.combatLog = combatLog.slice(-10); // Keep last 10 messages
      
      setCorrectAnswersThisCombat(newCorrectAnswers);
      return newState;
    });
  }, [gameState, correctAnswersThisCombat]);

  const equipWeapon = useCallback((weapon: Weapon) => {
    setGameState(prev => prev ? {
      ...prev,
      inventory: {
        ...prev.inventory,
        currentWeapon: weapon
      }
    } : prev);
  }, []);

  const equipArmor = useCallback((armor: Armor) => {
    setGameState(prev => prev ? {
      ...prev,
      inventory: {
        ...prev.inventory,
        currentArmor: armor
      }
    } : prev);
  }, []);

  const upgradeWeapon = useCallback((weaponId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const weapon = prev.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon || prev.gems < weapon.upgradeCost) return prev;
      
      const updatedWeapons = prev.inventory.weapons.map(w => 
        w.id === weaponId 
          ? { ...w, level: w.level + 1, upgradeCost: Math.floor(w.upgradeCost * 1.5) }
          : w
      );
      
      let updatedCurrentWeapon = prev.inventory.currentWeapon;
      if (updatedCurrentWeapon?.id === weaponId) {
        updatedCurrentWeapon = updatedWeapons.find(w => w.id === weaponId) || null;
      }
      
      return {
        ...prev,
        gems: prev.gems - weapon.upgradeCost,
        inventory: {
          ...prev.inventory,
          weapons: updatedWeapons,
          currentWeapon: updatedCurrentWeapon
        },
        statistics: {
          ...prev.statistics,
          itemsUpgraded: prev.statistics.itemsUpgraded + 1
        }
      };
    });
  }, []);

  const upgradeArmor = useCallback((armorId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const armor = prev.inventory.armor.find(a => a.id === armorId);
      if (!armor || prev.gems < armor.upgradeCost) return prev;
      
      const updatedArmor = prev.inventory.armor.map(a => 
        a.id === armorId 
          ? { ...a, level: a.level + 1, upgradeCost: Math.floor(a.upgradeCost * 1.5) }
          : a
      );
      
      let updatedCurrentArmor = prev.inventory.currentArmor;
      if (updatedCurrentArmor?.id === armorId) {
        updatedCurrentArmor = updatedArmor.find(a => a.id === armorId) || null;
      }
      
      return {
        ...prev,
        gems: prev.gems - armor.upgradeCost,
        inventory: {
          ...prev.inventory,
          armor: updatedArmor,
          currentArmor: updatedCurrentArmor
        },
        statistics: {
          ...prev.statistics,
          itemsUpgraded: prev.statistics.itemsUpgraded + 1
        }
      };
    });
  }, []);

  const sellWeapon = useCallback((weaponId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const weapon = prev.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon) return prev;
      
      const updatedWeapons = prev.inventory.weapons.filter(w => w.id !== weaponId);
      let updatedCurrentWeapon = prev.inventory.currentWeapon;
      
      if (updatedCurrentWeapon?.id === weaponId) {
        updatedCurrentWeapon = null;
      }
      
      return {
        ...prev,
        coins: prev.coins + weapon.sellPrice,
        inventory: {
          ...prev.inventory,
          weapons: updatedWeapons,
          currentWeapon: updatedCurrentWeapon
        },
        statistics: {
          ...prev.statistics,
          itemsSold: prev.statistics.itemsSold + 1
        }
      };
    });
  }, []);

  const sellArmor = useCallback((armorId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const armor = prev.inventory.armor.find(a => a.id === armorId);
      if (!armor) return prev;
      
      const updatedArmor = prev.inventory.armor.filter(a => a.id !== armorId);
      let updatedCurrentArmor = prev.inventory.currentArmor;
      
      if (updatedCurrentArmor?.id === armorId) {
        updatedCurrentArmor = null;
      }
      
      return {
        ...prev,
        coins: prev.coins + armor.sellPrice,
        inventory: {
          ...prev.inventory,
          armor: updatedArmor,
          currentArmor: updatedCurrentArmor
        },
        statistics: {
          ...prev.statistics,
          itemsSold: prev.statistics.itemsSold + 1
        }
      };
    });
  }, []);

  const openChest = useCallback((cost: number): ChestReward | null => {
    if (!gameState || gameState.coins < cost) return null;

    const weights = getChestRarityWeights(cost);
    const random = Math.random() * 100;
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical' = 'common';
    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        rarity = ['common', 'rare', 'epic', 'legendary', 'mythical'][i] as any;
        break;
      }
    }

    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, rarity) : generateArmor(false, rarity);
    
    setGameState(prev => {
      if (!prev) return prev;
      
      const newInventory = { ...prev.inventory };
      if (isWeapon) {
        newInventory.weapons = [...prev.inventory.weapons, item as Weapon];
      } else {
        newInventory.armor = [...prev.inventory.armor, item as Armor];
      }
      
      // Update collection book
      const newCollectionBook = { ...prev.collectionBook };
      if (isWeapon) {
        newCollectionBook.weapons[item.name] = true;
        newCollectionBook.totalWeaponsFound += 1;
      } else {
        newCollectionBook.armor[item.name] = true;
        newCollectionBook.totalArmorFound += 1;
      }
      newCollectionBook.rarityStats[rarity] += 1;
      
      return {
        ...prev,
        coins: prev.coins - cost,
        inventory: newInventory,
        collectionBook: newCollectionBook,
        statistics: {
          ...prev.statistics,
          chestsOpened: prev.statistics.chestsOpened + 1,
          itemsCollected: prev.statistics.itemsCollected + 1
        }
      };
    });

    return {
      type: isWeapon ? 'weapon' : 'armor',
      items: [item]
    };
  }, [gameState]);

  const discardItem = useCallback((itemId: string, type: 'weapon' | 'armor') => {
    setGameState(prev => {
      if (!prev) return prev;
      
      if (type === 'weapon') {
        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            weapons: prev.inventory.weapons.filter(w => w.id !== itemId)
          }
        };
      } else {
        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            armor: prev.inventory.armor.filter(a => a.id !== itemId)
          }
        };
      }
    });
  }, []);

  const purchaseMythical = useCallback((cost: number): boolean => {
    if (!gameState || gameState.coins < cost) return false;

    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, 'mythical') : generateArmor(false, 'mythical');
    
    setGameState(prev => {
      if (!prev) return prev;
      
      const newInventory = { ...prev.inventory };
      if (isWeapon) {
        newInventory.weapons = [...prev.inventory.weapons, item as Weapon];
      } else {
        newInventory.armor = [...prev.inventory.armor, item as Armor];
      }
      
      return {
        ...prev,
        coins: prev.coins - cost,
        inventory: newInventory,
        statistics: {
          ...prev.statistics,
          itemsCollected: prev.statistics.itemsCollected + 1
        }
      };
    });

    return true;
  }, [gameState]);

  const resetGame = useCallback(() => {
    const newState = createInitialGameState();
    setGameState(newState);
    setCorrectAnswersThisCombat(0);
  }, []);

  const setGameMode = useCallback((mode: 'normal' | 'blitz' | 'bloodlust') => {
    setGameState(prev => prev ? {
      ...prev,
      gameMode: {
        ...prev.gameMode,
        current: mode
      }
    } : prev);
  }, []);

  const toggleCheat = useCallback((cheat: keyof typeof gameState.cheats) => {
    setGameState(prev => prev ? {
      ...prev,
      cheats: {
        ...prev.cheats,
        [cheat]: !prev.cheats[cheat]
      }
    } : prev);
  }, [gameState]);

  const generateCheatItem = useCallback(() => {
    if (!gameState) return;
    
    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, 'mythical') : generateArmor(false, 'mythical');
    
    setGameState(prev => {
      if (!prev) return prev;
      
      const newInventory = { ...prev.inventory };
      if (isWeapon) {
        newInventory.weapons = [...prev.inventory.weapons, item as Weapon];
      } else {
        newInventory.armor = [...prev.inventory.armor, item as Armor];
      }
      
      return {
        ...prev,
        inventory: newInventory
      };
    });
  }, [gameState]);

  const mineGem = useCallback((x: number, y: number): { gems: number; shinyGems: number } | null => {
    if (!gameState) return null;

    const isShiny = Math.random() < 0.05;
    const gems = isShiny ? 0 : 1;
    const shinyGems = isShiny ? 1 : 0;

    setGameState(prev => prev ? {
      ...prev,
      gems: prev.gems + gems,
      shinyGems: prev.shinyGems + shinyGems,
      mining: {
        totalGemsMined: prev.mining.totalGemsMined + gems,
        totalShinyGemsMined: prev.mining.totalShinyGemsMined + shinyGems
      },
      statistics: {
        ...prev.statistics,
        gemsEarned: prev.statistics.gemsEarned + gems,
        shinyGemsEarned: prev.statistics.shinyGemsEarned + shinyGems
      }
    } : prev);

    return { gems, shinyGems };
  }, [gameState]);

  const exchangeShinyGems = useCallback((amount: number): boolean => {
    if (!gameState || gameState.shinyGems < amount) return false;

    const regularGems = amount * 10;

    setGameState(prev => prev ? {
      ...prev,
      shinyGems: prev.shinyGems - amount,
      gems: prev.gems + regularGems
    } : prev);

    return true;
  }, [gameState]);

  const purchaseRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;

    const relic = gameState.yojefMarket.items.find(r => r.id === relicId);
    if (!relic || gameState.gems < relic.cost) return false;

    setGameState(prev => {
      if (!prev) return prev;
      
      // Remove the purchased relic and add a new one to maintain exactly 2 (1 weapon, 1 armor)
      const updatedItems = [...prev.yojefMarket.items];
      const purchasedIndex = updatedItems.findIndex(r => r.id === relicId);
      if (purchasedIndex !== -1) {
        // Generate same type of relic to replace it
        updatedItems[purchasedIndex] = generateRelicItem(relic.type);
      }
      
      return {
        ...prev,
        gems: prev.gems - relic.cost,
        inventory: {
          ...prev.inventory,
          relics: [...prev.inventory.relics, relic]
        },
        yojefMarket: {
          ...prev.yojefMarket,
          items: updatedItems
        }
      };
    });

    return true;
  }, [gameState]);

  const upgradeRelic = useCallback((relicId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const relic = prev.inventory.relics.find(r => r.id === relicId);
      if (!relic || prev.gems < relic.upgradeCost) return prev;
      
      const updatedRelics = prev.inventory.relics.map(r => 
        r.id === relicId 
          ? { ...r, level: r.level + 1, upgradeCost: Math.floor(r.upgradeCost * 1.5) }
          : r
      );
      
      const updatedEquippedRelics = prev.inventory.equippedRelics.map(r => 
        r.id === relicId 
          ? { ...r, level: r.level + 1, upgradeCost: Math.floor(r.upgradeCost * 1.5) }
          : r
      );
      
      return {
        ...prev,
        gems: prev.gems - relic.upgradeCost,
        inventory: {
          ...prev.inventory,
          relics: updatedRelics,
          equippedRelics: updatedEquippedRelics
        }
      };
    });
  }, []);

  const equipRelic = useCallback((relicId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const relic = prev.inventory.relics.find(r => r.id === relicId);
      if (!relic) return prev;
      
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          equippedRelics: [...prev.inventory.equippedRelics, relic]
        }
      };
    });
  }, []);

  const unequipRelic = useCallback((relicId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          equippedRelics: prev.inventory.equippedRelics.filter(r => r.id !== relicId)
        }
      };
    });
  }, []);

  const sellRelic = useCallback((relicId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const relic = prev.inventory.relics.find(r => r.id === relicId);
      if (!relic) return prev;
      
      const sellPrice = Math.floor(relic.cost * 0.5);
      
      return {
        ...prev,
        gems: prev.gems + sellPrice,
        inventory: {
          ...prev.inventory,
          relics: prev.inventory.relics.filter(r => r.id !== relicId),
          equippedRelics: prev.inventory.equippedRelics.filter(r => r.id !== relicId)
        }
      };
    });
  }, []);

  const claimDailyReward = useCallback((): boolean => {
    if (!gameState || !gameState.dailyRewards.availableReward) return false;

    const reward = gameState.dailyRewards.availableReward;
    
    setGameState(prev => {
      if (!prev || !prev.dailyRewards.availableReward) return prev;
      
      return {
        ...prev,
        coins: prev.coins + reward.coins,
        gems: prev.gems + reward.gems,
        dailyRewards: {
          ...prev.dailyRewards,
          lastClaimDate: new Date(),
          currentStreak: prev.dailyRewards.currentStreak + 1,
          maxStreak: Math.max(prev.dailyRewards.maxStreak, prev.dailyRewards.currentStreak + 1),
          availableReward: null,
          rewardHistory: [...prev.dailyRewards.rewardHistory, { ...reward, claimed: true, claimDate: new Date() }]
        }
      };
    });

    return true;
  }, [gameState]);

  const upgradeSkill = useCallback((skillId: string): boolean => {
    if (!gameState) return false;

    setGameState(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        progression: {
          ...prev.progression,
          unlockedSkills: [...prev.progression.unlockedSkills, skillId]
        }
      };
    });

    return true;
  }, [gameState]);

  const prestige = useCallback((): boolean => {
    // Prestige disabled without levels
    return false;
    
  }, [gameState]);

  const claimOfflineRewards = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        coins: prev.coins + prev.offlineProgress.offlineCoins,
        gems: prev.gems + prev.offlineProgress.offlineGems,
        offlineProgress: {
          ...prev.offlineProgress,
          offlineCoins: 0,
          offlineGems: 0,
          offlineTime: 0
        }
      };
    });
  }, []);

  const bulkSell = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    setGameState(prev => {
      if (!prev) return prev;
      
      let totalValue = 0;
      
      if (type === 'weapon') {
        const itemsToSell = prev.inventory.weapons.filter(w => itemIds.includes(w.id));
        totalValue = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        
        return {
          ...prev,
          coins: prev.coins + totalValue,
          inventory: {
            ...prev.inventory,
            weapons: prev.inventory.weapons.filter(w => !itemIds.includes(w.id)),
            currentWeapon: itemIds.includes(prev.inventory.currentWeapon?.id || '') ? null : prev.inventory.currentWeapon
          }
        };
      } else {
        const itemsToSell = prev.inventory.armor.filter(a => itemIds.includes(a.id));
        totalValue = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        
        return {
          ...prev,
          coins: prev.coins + totalValue,
          inventory: {
            ...prev.inventory,
            armor: prev.inventory.armor.filter(a => !itemIds.includes(a.id)),
            currentArmor: itemIds.includes(prev.inventory.currentArmor?.id || '') ? null : prev.inventory.currentArmor
          }
        };
      }
    });
  }, []);

  const bulkUpgrade = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    setGameState(prev => {
      if (!prev) return prev;
      
      let totalCost = 0;
      
      if (type === 'weapon') {
        const itemsToUpgrade = prev.inventory.weapons.filter(w => itemIds.includes(w.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);
        
        if (prev.gems < totalCost) return prev;
        
        const updatedWeapons = prev.inventory.weapons.map(w => 
          itemIds.includes(w.id) 
            ? { ...w, level: w.level + 1, upgradeCost: Math.floor(w.upgradeCost * 1.5) }
            : w
        );
        
        return {
          ...prev,
          gems: prev.gems - totalCost,
          inventory: {
            ...prev.inventory,
            weapons: updatedWeapons,
            currentWeapon: prev.inventory.currentWeapon && itemIds.includes(prev.inventory.currentWeapon.id) 
              ? updatedWeapons.find(w => w.id === prev.inventory.currentWeapon?.id) || null
              : prev.inventory.currentWeapon
          }
        };
      } else {
        const itemsToUpgrade = prev.inventory.armor.filter(a => itemIds.includes(a.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);
        
        if (prev.gems < totalCost) return prev;
        
        const updatedArmor = prev.inventory.armor.map(a => 
          itemIds.includes(a.id) 
            ? { ...a, level: a.level + 1, upgradeCost: Math.floor(a.upgradeCost * 1.5) }
            : a
        );
        
        return {
          ...prev,
          gems: prev.gems - totalCost,
          inventory: {
            ...prev.inventory,
            armor: updatedArmor,
            currentArmor: prev.inventory.currentArmor && itemIds.includes(prev.inventory.currentArmor.id) 
              ? updatedArmor.find(a => a.id === prev.inventory.currentArmor?.id) || null
              : prev.inventory.currentArmor
          }
        };
      }
    });
  }, []);

  const plantSeed = useCallback((): boolean => {
    if (!gameState || gameState.coins < gameState.gardenOfGrowth.seedCost || gameState.gardenOfGrowth.isPlanted) {
      return false;
    }

    setGameState(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        coins: prev.coins - prev.gardenOfGrowth.seedCost,
        gardenOfGrowth: {
          ...prev.gardenOfGrowth,
          isPlanted: true,
          plantedAt: new Date(),
          lastWatered: new Date(),
          waterHoursRemaining: 24
        }
      };
    });

    return true;
  }, [gameState]);

  const buyWater = useCallback((hours: number): boolean => {
    if (!gameState || gameState.coins < gameState.gardenOfGrowth.waterCost) {
      return false;
    }

    setGameState(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        coins: prev.coins - prev.gardenOfGrowth.waterCost,
        gardenOfGrowth: {
          ...prev.gardenOfGrowth,
          waterHoursRemaining: prev.gardenOfGrowth.waterHoursRemaining + hours,
          lastWatered: new Date()
        }
      };
    });

    return true;
  }, [gameState]);

  const updateSettings = useCallback((newSettings: Partial<typeof gameState.settings>) => {
    setGameState(prev => prev ? {
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings
      }
    } : prev);
  }, [gameState]);

  const addCoins = useCallback((amount: number) => {
    setGameState(prev => prev ? {
      ...prev,
      coins: prev.coins + amount
    } : prev);
  }, []);

  const addGems = useCallback((amount: number) => {
    setGameState(prev => prev ? {
      ...prev,
      gems: prev.gems + amount
    } : prev);
  }, []);

  const teleportToZone = useCallback((zone: number) => {
    setGameState(prev => prev ? {
      ...prev,
      zone: Math.max(1, zone)
    } : prev);
  }, []);

  const setExperience = useCallback((xp: number) => {
    setGameState(prev => prev ? {
      ...prev,
      progression: {
        ...prev.progression,
        experience: Math.max(0, xp)
      }
    } : prev);
  }, []);

  const rollSkill = useCallback((): boolean => {
    // Menu skills removed - this function is no longer used
    return false;
  }, []);

  const spendFragments = useCallback((): boolean => {
    if (!gameState || gameState.merchant.hugollandFragments < 3) return false;

    // Generate 3 random rewards
    const rewards: MerchantReward[] = [
      {
        id: '1',
        type: 'coins',
        name: 'Coin Treasure',
        description: 'A large amount of coins',
        icon: '💰',
        coins: 5000 + Math.floor(Math.random() * 5000)
      },
      {
        id: '2',
        type: 'gems',
        name: 'Gem Collection',
        description: 'A collection of precious gems',
        icon: '💎',
        gems: 500 + Math.floor(Math.random() * 500)
      },
      {
        id: '3',
        type: 'item',
        name: 'Legendary Equipment',
        description: 'A powerful piece of equipment',
        icon: '⚔️',
        item: Math.random() < 0.5 ? generateWeapon(false, 'legendary') : generateArmor(false, 'legendary')
      }
    ];

    setGameState(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        merchant: {
          ...prev.merchant,
          hugollandFragments: prev.merchant.hugollandFragments - 3,
          showRewardModal: true,
          availableRewards: rewards
        }
      };
    });

    return true;
  }, [gameState]);

  const selectMerchantReward = useCallback((reward: MerchantReward) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      let newState = { ...prev };
      
      switch (reward.type) {
        case 'coins':
          newState.coins += reward.coins || 0;
          break;
        case 'gems':
          newState.gems += reward.gems || 0;
          break;
        case 'item':
          if (reward.item) {
            if ('baseAtk' in reward.item) {
              newState.inventory.weapons = [...prev.inventory.weapons, reward.item as Weapon];
            } else {
              newState.inventory.armor = [...prev.inventory.armor, reward.item as Armor];
            }
          }
          break;
      }
      
      newState.merchant = {
        ...prev.merchant,
        showRewardModal: false,
        availableRewards: []
      };
      
      return newState;
    });
  }, []);

  // Calculate total stats including equipment and bonuses
  const calculateTotalStats = useCallback(() => {
    if (!gameState) return { hp: 300, maxHp: 300, atk: 50, def: 20 };

    let totalAtk = gameState.playerStats.baseAtk;
    let totalDef = gameState.playerStats.baseDef;
    let totalHp = gameState.playerStats.baseHp;

    // Add weapon stats
    if (gameState.inventory.currentWeapon) {
      const weapon = gameState.inventory.currentWeapon;
      totalAtk += weapon.baseAtk + (weapon.level - 1) * 10;
    }

    // Add armor stats
    if (gameState.inventory.currentArmor) {
      const armor = gameState.inventory.currentArmor;
      totalDef += armor.baseDef + (armor.level - 1) * 5;
    }

    // Add relic stats
    gameState.inventory.equippedRelics.forEach(relic => {
      if (relic.type === 'weapon' && relic.baseAtk) {
        totalAtk += relic.baseAtk + (relic.level - 1) * 22;
      } else if (relic.type === 'armor' && relic.baseDef) {
        totalDef += relic.baseDef + (relic.level - 1) * 15;
      }
    });

    // Add research bonuses
    totalAtk += gameState.research.bonuses.atk;
    totalDef += gameState.research.bonuses.def;
    totalHp += gameState.research.bonuses.hp;

    // Add garden bonuses
    if (gameState.gardenOfGrowth.isPlanted) {
      const bonus = gameState.gardenOfGrowth.totalGrowthBonus / 100;
      totalAtk = Math.floor(totalAtk * (1 + bonus));
      totalDef = Math.floor(totalDef * (1 + bonus));
      totalHp = Math.floor(totalHp * (1 + bonus));
    }

    return {
      hp: Math.min(gameState.playerStats.hp, totalHp),
      maxHp: totalHp,
      atk: totalAtk,
      def: totalDef
    };
  }, [gameState]);

  // Update player stats when equipment changes
  useEffect(() => {
    if (gameState && !isLoading) {
      const newStats = calculateTotalStats();
      setGameState(prev => prev ? {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          atk: newStats.atk,
          def: newStats.def,
          maxHp: newStats.maxHp,
          hp: Math.min(prev.playerStats.hp, newStats.maxHp)
        }
      } : prev);
    }
  }, [gameState?.inventory?.currentWeapon, gameState?.inventory?.currentArmor, gameState?.inventory?.equippedRelics, isLoading]);

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
    purchaseMythical,
    startCombat,
    attack,
    resetGame,
    setGameMode,
    toggleCheat,
    generateCheatItem,
    mineGem,
    exchangeShinyGems,
    discardItem,
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
    selectMerchantReward
  };
};

export default useGameState;