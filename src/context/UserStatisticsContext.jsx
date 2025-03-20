import React, { createContext, useEffect, useState } from "react";
import { dataClient } from "..";

// User statistics are loaded/updated during these actions:
// 1) User login - loads user/daily/weekly stats; if no stats, writes stats
// 2) After each game - updates user/daily/weekly stats
// 3) User logout - updates user/daily/weekly stats (not necessary due to option 2)
// Beyond MVP: enhancement only write after each session, tab close, or refresh

const UserStatisticsContext = createContext();

export const UserStatisticsProvider = ({children}) => {
    // ✅ Create react states

    const schema = {
        yyyymmdd: '',
        current_streak: 0,
        longest_streak: 0,
        // days_on_platform: a.integer(),
        // sk: "",
        // total_sessions: 0,
        total: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,            
        },
        math: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
        },
        visual: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0, 
        },
        reaction: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,             
        },        
        easy: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
        },
        medium: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
        },
        hard: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
        },
    }

    const [dailyStats, setDailyStats] = useState(structuredClone(schema))
    const [weeklyStats, setWeeklyStats] = useState(structuredClone(schema))
    const [userStats, setUserStats] = useState(structuredClone(schema))
    const [queryStatistics, setQueryStatistics] = useState('')

    // Write to database before tab closes or refreshed 
    // Beyond MVP; need to wrap graphQL query into JSON message instead of using function
    // useEffect(() => {
    //     const handleBeforeUnload = (event) => {
    //         event.preventDefault();

    //         navigator.sendBeacon(updateStats("daily", dailyStats))
    //         navigator.sendBeacon(updateStats("weekly", weeklyStats))
    //         navigator.sendBeacon(updateStats("", userStats))
    //     };

    //     window.addEventListener('beforeunload', handleBeforeUnload);

    //     return () => {
    //         window.removeEventListener('beforeunload', handleBeforeUnload);
    //     };
    // }, []);

    // ✅ Date functions
    const formatDate = (unixTimestamp) => {
        const date = new Date(unixTimestamp)
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
      }
    
    const getStartOfWeek = () => {
        const today = new Date(Date.now());
        const dayOfWeek = today.getDay();
        const startOfWeekUnix = today - (dayOfWeek * 86400000)
    
        return formatDate(startOfWeekUnix)
    }

    const getYearMonthDate = (frequency) => {
        const yyyymmdd = frequency === 'daily' ? formatDate(Date.now())
                : frequency === 'weekly' ? getStartOfWeek()
                : formatDate(Date.now())

        return yyyymmdd
    }

    // parse JSON response
    const parseNestedJson = (data) => {
        return Object.entries(data).reduce((acc, [key, value]) => {
          try {
            acc[key] = JSON.parse(value);
          } catch {
            acc[key] = value;
          }
          return acc;
        }, {});
      };

    // ✅ Update React state
    const updateStatsState = (frequency, gameType, difficulty, newStatistics ) => {
        const { correct } = newStatistics;
        const setStatsSetter = frequency === 'daily' ? setDailyStats
            : frequency === 'weekly' ? setWeeklyStats
            : setUserStats;

        setStatsSetter(prevStats => {
            const totalQuestions = prevStats.total.total_questions + 1;
            const totalCorrect = correct ? prevStats.total.State.total_correct + 1 : prevStats.total.total_correct;

            const gameQuestions = prevStats[gameType].total_questions + 1;
            const gameCorrect = correct ? prevStats[gameType].total_correct + 1 : prevStats[gameType].total_correct;

            const diffQuestions = prevStats[difficulty].total_questions + 1;
            const diffCorrect = correct ? prevStats[difficulty].total_correct + 1 : prevStats[difficulty].total_correct;

            return {
                ...prevStats,
                total: {
                    total_questions: totalQuestions,
                    total_correct: totalCorrect,
                    percent_correct: totalQuestions > 0
                        ? parseFloat((totalCorrect / totalQuestions).toFixed(3))
                        : 0.0,
                },
                [gameType]: {
                    total_questions: gameQuestions,
                    total_correct: gameCorrect,
                    percent_correct: gameQuestions > 0
                        ? parseFloat((gameCorrect / gameQuestions).toFixed(3))
                        : 0.0,
                },
                [difficulty]: {
                    total_questions: diffQuestions,
                    total_correct: diffCorrect,
                    percent_correct: diffQuestions > 0
                    ? parseFloat((diffCorrect / diffQuestions).toFixed(3))
                    : 0.0,
                },
            }
        })
    };

    // Update current streak and longest streak on initial login
    const updateStreak = (inputData) => {
        const newStreak = inputData.current_streak + 1
        const longestStreak = inputData.longest_streak
        return {
            ...inputData,
            current_streak: newStreak,
            longest_streak: newStreak > longestStreak ? newStreak : longestStreak
        }
    }

    // ✅ Add statistics
    const addStats = async (frequency, inputData) => {
        try {
            const yyyymmdd = getYearMonthDate(frequency)

            const { data, errors } = await dataClient.mutations.addStats({
                frequency: frequency,
                yyyymmdd: yyyymmdd, // yyyymmdd for current day or sunday
                data: inputData,
            });

            if (errors) {
                console.error('Check inputs or CloudWatch logs:', errors);
            } else {
                console.log(`Successful ${frequency} add`, data);
            }
        } catch (error) {
            console.error('Error with function in UserStatisticsContext.jsx', error)
        }
    }

    // ✅ Query statistics
    const getStats = async (frequency) => {
        try {
            const { data, errors } = await dataClient.queries.getStats({
                frequency: frequency,
                limit: 1,
            });

            if (errors) {
                console.error('Check inputs or CloudWatch logs:', errors);
                return;
            }

            if (!data) {
                console.warn("No user state data returned.");
                return;
            }
        } catch (error) {
            console.error('Error with function in UserStatisticsContext.jsx', error);
        }
    }

    const queryStats = async(frequency, queryLimit) => {
        try {
            const { data, errors } = await dataClient.queries.getStats({
                frequency: frequency,
                limit: (queryLimit) ? parseInt(queryLimit) : 0,
            });
            
            if (errors) {
                console.error('Check inputs or CloudWatch logs:', errors);
            } else {
                console.log(`Successful ${frequency} query`, data);
                setQueryStatistics(data)
                return data
            }
        } catch (error) {
            console.error('Error with function in UserStateContext.jsx:', error)
        }
    }

    const updateStats = async(frequency, inputData) => {
        try {
            // const yyyymmdd = getYearMonthDate(frequency)

            const { data, errors } = await dataClient.mutations.updateStats({
                frequency: frequency,
                // yyyymmdd: yyyymmdd,
                data: inputData
            });

            if (errors) {
                console.error('Check inputs or CloudWatch logs:', errors);
            } else {
                console.log(`Successful ${frequency} update`, data);
            }
        } catch (error) {
            console.error('Error with function in UserStatisticsContext.jsx', error)
        }
    }

    return (
        <UserStatisticsContext.Provider value ={{
            dailyStats,
            setDailyStats,
            weeklyStats,
            setWeeklyStats,
            userStats,
            setUserStats,
            queryStatistics,
            setQueryStatistics,
            updateStatsState,
            // updateWeeklyStatsState,
            addStats,
            getStats,
            queryStats,
            updateStats,
            parseNestedJson,
            updateStreak,
            formatDate,
        }}>
            { children }
        </UserStatisticsContext.Provider>
    );
};

export default UserStatisticsContext