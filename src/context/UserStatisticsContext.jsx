import React, { createContext, useEffect, useState } from "react";
import { dataClient } from "..";
import { getDiffString } from "../functions/Model"

// User statistics are loaded/updated during these actions:
// 1) User login - loads user/daily/weekly stats; if no stats, writes stats
// 2) After each game - updates user/daily/weekly stats
// 3) User logout - updates user/daily/weekly stats (not necessary due to option 2)
// Beyond MVP: enhancement only write after each session, tab close, or refresh

const UserStatisticsContext = createContext();

export const UserStatisticsProvider = ({children}) => {
    // ✅ Create react states
    const [userStats, setUserStats] = useState("")
    const [dailyStats, setDailyStats] = useState("")
    const [weeklyStats, setWeeklyStats] = useState("")
    const [queryStatistics, setQueryStatistics] = useState('')

    useEffect(() => {
        console.log("Updated query statistics:", queryStatistics);
    }, [queryStatistics]);
    
    useEffect(() => {
        console.log("Updated user statistics:", userStats);
    }, [userStats]);

    useEffect(() => {
        console.log("Updated daily statistics:", dailyStats);
    }, [dailyStats]); 

    useEffect(() => {
        console.log("Updated weekly statistics:", weeklyStats);
    }, [weeklyStats]); 
    
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

    // FUNCTIONS
    const formatDate = (unixTimestamp) => {
        const date = new Date(unixTimestamp)
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
      }
    
    const getStartOfWeekUnix = (unix = Date.now()) => {
        const today = new Date(unix);
        const dayOfWeek = today.getDay();
        const startOfWeekUnix = today - (dayOfWeek * 86400000)
    
        return startOfWeekUnix
    }

    const getYearMonthDate = (frequency) => {
        const yyyymmdd = frequency === 'daily' ? formatDate(Date.now())
                : frequency === 'weekly' ? formatDate(getStartOfWeekUnix())
                : formatDate(Date.now())

        return yyyymmdd
    }

    function dateDiffInDays(unix1, unix2) {
        const diffTime = Math.abs(unix2 - unix1); // Get absolute difference in milliseconds
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Convert ms to days
    }

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

    // INITIAL SCHEMAS
    const schema = {
        yyyymmdd: '',
        // total_sessions: 0,
        total: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0,            
        },
        math: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0, 
        },
        visual: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0,  
        },
        reaction: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0,              
        },
        memory: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0,              
        },
        trivia: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0,              
        },                
        easy: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0, 
        },
        medium: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0, 
        },
        hard: {
            total_questions: 0,
            total_correct: 0,
            percent_correct: 0.0,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0, 
        },
    }

    const userSchema = {
        ...schema,
        yyyymmdd: getYearMonthDate(""),
        current_streak: 0,
        longest_streak: 0,
    }

    const dailySchema = {
        ...schema,
        yyyymmdd: getYearMonthDate("daily"),
        current_streak: 1,
        longest_streak: 1,        
    }

    const weeklySchema = {
        ...schema,
        yyyymmdd: getYearMonthDate("weekly"),
        current_streak: 1,
        longest_streak: 1,           
    }

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
    const updateStreak = (frequency, inputData) => {
        const newStreak = inputData.current_streak + 1;
        const longestStreak = inputData.longest_streak;

        return {
            ...inputData,
            yyyymmdd: String(getYearMonthDate(frequency)),
            current_streak: newStreak,
            longest_streak: newStreak > longestStreak ? newStreak : longestStreak,
        }
    }

    // Update totals after game is answered
    const updateTotals = (inputData, isCorrect, game, difficulty) => {
        const totalData = incrementCorrect(inputData.total, isCorrect);
        console.log("GAME", game)
        console.log("INPUT DATA", inputData)
        const gameData = incrementCorrect(inputData[game], isCorrect);
        const diffStr = (typeof(difficulty) === "number") 
        ? getDiffString(difficulty) 
        : difficulty

        const difficultyData = incrementCorrect(inputData[diffStr], isCorrect);
        return {
            ...inputData,
            total: totalData,
            [game]: gameData,
            [diffStr]: difficultyData
        };
    }

    const incrementCorrect = (inputData, isCorrect) => {
        console.log("INCREMENT CORRECT DATA", inputData)
        const totalQuestions = inputData.total_questions + 1;
        const totalCorrect = (isCorrect) ? inputData.total_correct + 1 : inputData.total_correct;
        const currentQuestions = inputData.current_total + 1;
        const currentCorrect = (isCorrect) ? inputData.current_correct + 1 : inputData.current_correct;

        return {
            ...inputData,
            total_questions: totalQuestions,
            total_correct: totalCorrect,
            percent_correct: parseFloat((totalCorrect / totalQuestions).toFixed(3)),
            current_total: currentQuestions,
            current_correct: currentCorrect,
            current_percent: parseFloat((currentCorrect / currentQuestions).toFixed(3))
        }
    }

    const resetTotals = (inputData) => {
        return {
            ...inputData,
            current_streak: 1,
            total: resetCurrent(inputData.total),
            math: resetCurrent(inputData.math),
            visual: resetCurrent(inputData.visual),
            reaction: resetCurrent(inputData.reaction),
            easy: resetCurrent(inputData.easy),
            medium: resetCurrent(inputData.medium),
            hard: resetCurrent(inputData.hard),
        };
    }

    const resetCurrent = (inputData) => {
        return {
            ...inputData,
            current_total: 0,
            current_correct: 0,
            current_percent: 0.0
        }
    }

    // Handle first login
    const handleLoginStats = async () => {
        const stats = await queryStats("", 1)
        const daily = await queryStats("daily", 1)
        const weekly = await queryStats("weekly", 1)
    
        if (stats) {
            setUserStats(stats[0])
        } else {
            addStats("", JSON.stringify(userSchema))
            setUserStats(userSchema)
        };
    
        if (daily) {
            const unix1 = daily[0].updated_at;
            const unix2 = Math.floor(Date.now() / 1000)
            if (dateDiffInDays(unix1, unix2) === 1) {
                const newStats = updateStreak("daily", daily[0])
                setDailyStats(newStats)
            } else if (dateDiffInDays(unix1, unix2) === 0){
                setDailyStats(daily[0])
            } else {
                const newStreak = resetTotals(daily[0])
                setDailyStats(newStreak)
            }
        } else {
            addStats("daily", JSON.stringify(dailySchema))
            setDailyStats(dailySchema)
        }
        if (weekly) {
            const unix1 = getStartOfWeekUnix(weekly[0].updated_at);
            const unix2 = getStartOfWeekUnix(Math.floor(Date.now() / 1000));
            if (dateDiffInDays(unix1, unix2) === 7) { // need to redo logic
                const newStats = updateStreak("weekly", weekly[0])
                setWeeklyStats(newStats)
            } else if (dateDiffInDays(unix1, unix2) === 7) {
                setWeeklyStats(weekly[0])
            } else {
                const newStreak = resetTotals(weekly[0])
                setWeeklyStats(newStreak)
            }
        } else {
            addStats("weekly", JSON.stringify(weeklySchema))
            setWeeklyStats(weeklySchema)
        }; 
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

                const parsedData = (data) ? data.map(parseNestedJson) : data
                console.log(`Successful ${frequency} query`, parsedData);
                setQueryStatistics(parsedData)
                return parsedData
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

    const transactStatsData = async(userStatsData, dailyStatsData, weeklyStatsData) => {
        try {
            const userData = JSON.stringify(userStatsData);
            const dailyData = JSON.stringify(dailyStatsData);
            const weeklyData = JSON.stringify(weeklyStatsData);

            const userResult = await updateStats("", userData);
            const dailyResult = await updateStats("daily", dailyData);
            const weeklyResult = await updateStats("weekly", weeklyData);
            console.log("Transaction stats successful", { userResult, dailyResult, weeklyResult})
            return "DONE"
        } catch (error) {
            console.log("Error with function in UserStatisticsContext.jsx")
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
            handleLoginStats,
            updateTotals,
            transactStatsData,
        }}>
            { children }
        </UserStatisticsContext.Provider>
    );
};

export default UserStatisticsContext