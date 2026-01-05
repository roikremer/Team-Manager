
import React, { useState, useEffect } from 'react';
import { Player, PlayerSkills, Team, INITIAL_SKILLS, SKILL_LABELS, createInitialLeagueData, RoundStats } from './types';

type ViewState = 'home' | 'squad' | 'gameday' | 'league';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [squad, setSquad] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const savedSquad = localStorage.getItem('soccer-squad');
    if (savedSquad) {
      const parsed = JSON.parse(savedSquad);
      const migrated = parsed.map((p: any) => ({
        ...p,
        leagueData: p.leagueData || createInitialLeagueData()
      }));
      setSquad(migrated);
    }
  }, []);

  useEffect(() => {
    if (squad.length > 0) {
      localStorage.setItem('soccer-squad', JSON.stringify(squad));
    }
  }, [squad]);

  const calculateRank = (skills: PlayerSkills): number => {
    const values = Object.values(skills);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: 'שחקן חדש',
      skills: { ...INITIAL_SKILLS },
      rank: calculateRank(INITIAL_SKILLS),
      leagueData: createInitialLeagueData()
    };
    setSquad([...squad, newPlayer]);
    setEditingPlayer(newPlayer);
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setSquad(prevSquad => prevSquad.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        if (updates.skills) updated.rank = calculateRank(updated.skills);
        return updated;
      }
      return p;
    }));
  };

  const updateLeagueStat = (playerId: string, round: number, field: keyof RoundStats, value: number) => {
    setSquad(prevSquad => prevSquad.map(p => {
      if (p.id === playerId) {
        const newLeagueData = { ...p.leagueData };
        newLeagueData[round] = { ...newLeagueData[round], [field]: value };
        return { ...p, leagueData: newLeagueData };
      }
      return p;
    }));
  };

  const calculateTotal = (player: Player) => {
    let pts = 0;
    let gls = 0;
    Object.values(player.leagueData).forEach(round => {
      pts += round.points || 0;
      gls += round.goals || 0;
    });
    return { pts, gls };
  };

  const removePlayer = (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את השחקן מהסגל?')) {
      const newSquad = squad.filter(p => p.id !== id);
      setSquad(newSquad);
      localStorage.setItem('soccer-squad', JSON.stringify(newSquad));
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      if (selectedIds.length < 15) {
        setSelectedIds([...selectedIds, id]);
      } else {
        alert('ניתן לבחור עד 15 שחקנים בלבד ליום משחק');
      }
    }
  };

  const splitTeams = () => {
    if (selectedIds.length !== 15) return;
    const selectedPlayers = squad
      .filter(p => selectedIds.includes(p.id))
      .sort((a, b) => b.rank - a.rank);

    const newTeams: Team[] = [
      { name: 'קבוצה כחולה', color: 'bg-blue-600', players: [], totalRank: 0 },
      { name: 'קבוצה לבנה', color: 'bg-slate-100 text-slate-900', players: [], totalRank: 0 },
      { name: 'קבוצה אדומה', color: 'bg-red-600', players: [], totalRank: 0 }
    ];

    selectedPlayers.forEach(player => {
      const availableTeams = newTeams.filter(t => t.players.length < 5);
      if (availableTeams.length === 0) return;
      const targetTeam = availableTeams.reduce((min, curr) => (curr.totalRank < min.totalRank ? curr : min), availableTeams[0]);
      targetTeam.players.push(player);
      targetTeam.totalRank += player.rank;
    });
    setTeams(newTeams);
  };

  return (
    <div className="min-h-screen soccer-gradient pb-20 px-4 pt-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-slate-800/40 p-4 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex items-center gap-4">
            {view !== 'home' && (
              <button onClick={() => setView('home')} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase">Team Manager Pro</h1>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700">
            {squad.length} שחקנים בסגל
          </div>
        </header>

        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-in fade-in zoom-in duration-500">
            <button onClick={() => setView('gameday')} className="group bg-slate-800 border-2 border-slate-700 hover:border-blue-500 rounded-3xl p-8 text-right transition-all">
              <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-2xl font-black mb-2">יום משחק</h3>
              <p className="text-slate-400 text-sm">בחירת 15 למשחק וחלוקה לקבוצות.</p>
            </button>

            <button onClick={() => setView('squad')} className="group bg-slate-800 border-2 border-slate-700 hover:border-emerald-500 rounded-3xl p-8 text-right transition-all">
              <div className="bg-emerald-500 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-2xl font-black mb-2">סגל שחקנים</h3>
              <p className="text-slate-400 text-sm">ניהול יכולות, עריכה והוספת שחקנים.</p>
            </button>

            <button onClick={() => setView('league')} className="group bg-slate-800 border-2 border-slate-700 hover:border-yellow-500 rounded-3xl p-8 text-right transition-all">
              <div className="bg-yellow-500 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-2xl font-black mb-2">ניקוד ליגה</h3>
              <p className="text-slate-400 text-sm">מעקב שערים ונקודות לאורך העונה.</p>
            </button>
          </div>
        )}

        {/* SQUAD VIEW */}
        {view === 'squad' && (
          <section className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black">סגל הקבוצה</h2>
              <button onClick={addPlayer} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span>הוסף שחקן</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {squad.map(player => (
                <div key={player.id} className="player-card rounded-3xl p-5 flex items-center gap-4 group hover:border-blue-500/50 transition-all">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                      <span className="text-2xl font-black text-slate-500">{player.name[0]}</span>
                    </div>
                    <div className="rank-badge absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black">{player.rank}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{player.name}</h3>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setEditingPlayer(player)} className="text-[10px] bg-slate-700 px-3 py-1 rounded-md font-bold hover:bg-blue-600 transition-colors">ערוך</button>
                      <button onClick={() => removePlayer(player.id)} className="text-[10px] bg-slate-700 px-3 py-1 rounded-md font-bold hover:bg-red-600 transition-colors">מחק</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LEAGUE VIEW */}
        {view === 'league' && (
          <section className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black">טבלת ניקוד ליגה</h2>
              <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-400">
                נ' = נקודות | ש' = שערים
              </div>
            </div>

            {squad.length > 0 ? (
              <div className="bg-slate-800/50 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-slate-900/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-700">
                        <th className="p-4 w-48 text-right">שחקן</th>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(m => (
                          <th key={m} className="p-4 text-center border-r border-slate-700/30">מחזור {m}</th>
                        ))}
                        <th className="p-4 text-center border-r border-slate-700 bg-blue-500/10 text-blue-400">סה"כ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {squad.map(player => {
                        const total = calculateTotal(player);
                        return (
                          <tr key={player.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                            <td className="p-4 font-bold text-slate-200">{player.name}</td>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(m => (
                              <td key={m} className="p-2 border-r border-slate-700/20">
                                <div className="flex gap-1 justify-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[8px] text-slate-500 mb-0.5 font-bold">נ'</span>
                                    <input 
                                      type="number" 
                                      value={player.leagueData[m]?.points || 0}
                                      onChange={(e) => updateLeagueStat(player.id, m, 'points', parseInt(e.target.value) || 0)}
                                      className="w-10 bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs font-black text-white focus:border-blue-500 outline-none"
                                    />
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[8px] text-slate-500 mb-0.5 font-bold">ש'</span>
                                    <input 
                                      type="number" 
                                      value={player.leagueData[m]?.goals || 0}
                                      onChange={(e) => updateLeagueStat(player.id, m, 'goals', parseInt(e.target.value) || 0)}
                                      className="w-10 bg-slate-700 border border-slate-600 rounded p-1 text-center text-xs font-black text-emerald-400 focus:border-emerald-500 outline-none"
                                    />
                                  </div>
                                </div>
                              </td>
                            ))}
                            <td className="p-4 border-r border-slate-700 bg-blue-500/5 text-center">
                              <div className="flex flex-col font-black">
                                <span className="text-blue-400 text-sm">{total.pts} נ'</span>
                                <span className="text-emerald-400 text-xs">{total.gls} ש'</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                <p className="text-slate-500 font-bold">אין שחקנים בסגל. הוסף שחקנים כדי להזין ניקוד.</p>
              </div>
            )}
          </section>
        )}

        {/* GAMEDAY VIEW */}
        {view === 'gameday' && (
          <section className="space-y-6 animate-in slide-in-from-left duration-300">
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">בחירת 15 למשחק</h2>
                <div className="flex items-center gap-4">
                   <span className={`text-xl font-black ${selectedIds.length === 15 ? 'text-emerald-400' : 'text-blue-400'}`}>{selectedIds.length}/15</span>
                   {selectedIds.length === 15 && (
                     <button onClick={splitTeams} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-black shadow-lg">חלק לקבוצות</button>
                   )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {squad.map(player => (
                  <button key={player.id} onClick={() => toggleSelection(player.id)} className={`p-4 rounded-2xl border-2 font-bold transition-all ${selectedIds.includes(player.id) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
            
            {teams.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {teams.map((team, i) => (
                  <div key={i} className="bg-slate-800/80 rounded-3xl overflow-hidden border border-slate-700 shadow-xl">
                    <div className={`${team.color} p-4 flex justify-between items-center`}>
                      <h3 className="font-black">{team.name}</h3>
                      <span className="text-[10px] bg-black/20 px-2 py-1 rounded">רמה: {team.totalRank}</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {team.players.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg">
                          <span className="font-bold text-sm">{p.name}</span>
                          <span className="text-blue-400 text-[10px] font-black">{p.rank}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* EDIT OVERLAY */}
        {editingPlayer && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl text-right">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black">עריכת שחקן</h2>
                <button onClick={() => setEditingPlayer(null)} className="p-2 bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase">שם מלא</label>
                  <input 
                    type="text" 
                    value={editingPlayer.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      updatePlayer(editingPlayer.id, { name });
                      setEditingPlayer({ ...editingPlayer, name });
                    }}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-lg font-bold outline-none focus:border-blue-500 transition-all text-right"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(SKILL_LABELS) as Array<keyof PlayerSkills>).map(skill => (
                    <div key={skill} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black">
                         <span className="text-blue-400">{SKILL_LABELS[skill]}</span>
                         <span>{editingPlayer.skills[skill]}</span>
                      </div>
                      <input 
                        type="range" min="30" max="99" 
                        value={editingPlayer.skills[skill]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const newSkills = { ...editingPlayer.skills, [skill]: val };
                          updatePlayer(editingPlayer.id, { skills: newSkills });
                          setEditingPlayer({ ...editingPlayer, skills: newSkills, rank: calculateRank(newSkills) });
                        }}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl flex justify-between items-center border border-slate-700">
                  <span className="text-slate-400 font-bold">דירוג סופי</span>
                  <span className="text-4xl font-black text-yellow-500">{editingPlayer.rank}</span>
                </div>
                <button onClick={() => setEditingPlayer(null)} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-lg transition-all">שמור</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
