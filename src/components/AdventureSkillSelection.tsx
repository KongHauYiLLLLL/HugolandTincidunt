import React from 'react';
import { AdventureSkill } from '../types/game';
import { Zap, Shield, SkipForward, Heart, Eye, TrendingUp, Sword, Droplets, Clock, Target } from 'lucide-react';

interface AdventureSkillSelectionProps {
  availableSkills: AdventureSkill[];
  onSelectSkill: (skill: AdventureSkill) => void;
  onSkipSkills: () => void;
}

export const AdventureSkillSelection: React.FC<AdventureSkillSelectionProps> = ({
  availableSkills,
  onSelectSkill,
  onSkipSkills
}) => {
  const getSkillIcon = (type: string) => {
    switch (type) {
      case 'ramp': return <TrendingUp className="w-8 h-8 text-green-400" />;
      case 'lightning_chain': return <Zap className="w-8 h-8 text-yellow-400" />;
      case 'skip_card': return <SkipForward className="w-8 h-8 text-blue-400" />;
      case 'metal_shield': return <Shield className="w-8 h-8 text-gray-400" />;
      case 'truth_lies': return <Eye className="w-8 h-8 text-purple-400" />;
      case 'berserker': return <Sword className="w-8 h-8 text-red-500" />;
      case 'vampiric': return <Droplets className="w-8 h-8 text-red-600" />;
      case 'time_slow': return <Clock className="w-8 h-8 text-blue-500" />;
      case 'critical_strike': return <Target className="w-8 h-8 text-yellow-500" />;
      case 'healing_aura': return <Heart className="w-8 h-8 text-green-600" />;
      default: return <Zap className="w-8 h-8 text-gray-400" />;
    }
  };

  const getSkillColor = (type: string) => {
    switch (type) {
      case 'ramp': return 'from-green-900/50 to-emerald-900/50 border-green-500/50';
      case 'lightning_chain': return 'from-yellow-900/50 to-orange-900/50 border-yellow-500/50';
      case 'skip_card': return 'from-blue-900/50 to-cyan-900/50 border-blue-500/50';
      case 'metal_shield': return 'from-gray-900/50 to-slate-900/50 border-gray-500/50';
      case 'truth_lies': return 'from-purple-900/50 to-indigo-900/50 border-purple-500/50';
      case 'berserker': return 'from-red-900/50 to-red-800/50 border-red-600/50';
      case 'vampiric': return 'from-red-900/50 to-black/50 border-red-700/50';
      case 'time_slow': return 'from-blue-900/50 to-indigo-900/50 border-blue-600/50';
      case 'critical_strike': return 'from-yellow-900/50 to-orange-900/50 border-yellow-600/50';
      case 'healing_aura': return 'from-green-900/50 to-lime-900/50 border-green-700/50';
      default: return 'from-gray-900/50 to-slate-900/50 border-gray-500/50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6 rounded-lg border border-purple-500/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-white font-bold text-2xl mb-2">⚔️ Choose Your Adventure Skill</h2>
          <p className="text-purple-300">Select a skill to aid you in this adventure, or skip to continue without one</p>
          <p className="text-gray-400 text-sm mt-2">10 unique adventure skills available - 3 randomly selected each adventure</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {availableSkills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => onSelectSkill(skill)}
              className={`p-4 rounded-lg border-2 bg-gradient-to-br ${getSkillColor(skill.type)} hover:scale-105 transition-all duration-200`}
            >
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  {getSkillIcon(skill.type)}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{skill.name}</h3>
                <p className="text-gray-300 text-sm">{skill.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onSkipSkills}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Skip Skills
          </button>
        </div>
      </div>
    </div>
  );
};