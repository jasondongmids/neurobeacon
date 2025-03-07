import { InventoryFrequency } from "aws-cdk-lib/aws-s3";
import React, { createContext, useState, useEffect } from "react";
import { dataClient } from "..";

const UserStatisticsContext = createContext();

export const UserStatisticsProvider = ({children}) => {
    // ✅ Create react states
    const [dailyStats, setDailyStats] = useState({
        // current_streak: a.integer(),
        // days_on_platform: a.integer(),
        // sk: "",
        total_sessions: 0,
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
            total_correct: 0             
        },
    });

    const [weeklyStats, setWeeklyStats] = useState({
        // current_streak: a.integer(),
        // days_on_platform: a.integer(),
        // sk: "",
        total_sessions: 0,
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
    });

    const [queryStatistics, setQueryStatistics] = useState('')

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
                : Date.now()

        return yyyymmdd
    }

    // ✅ Update React state
    const updateDailyStatsState = (gameType, newDailyStatistics) => {
        const { correct } = newDailyStatistics;

        setDailyStats(prevStats => {
            const totalQuestions = prevStats.total.total_questions + 1;
            const totalCorrect = correct ? prevStats.total.State.total_correct + 1 : prevStats.total.total_correct;

            const gameQuestions = prevStats[gameType].total_questions + 1;
            const gameCorrect = correct ? prevStats[gameType].total_correct + 1 : prevStats[gameType].total_correct;

            return {
                ...prevStats,
                total: {
                    total_questions: totalQuestions,
                    total_correct: totalCorrect,
                    percent_correct: totalCorrect / totalQuestions
                },
                [gameType]: {
                    total_questions: gameQuestions,
                    total_correct: gameCorrect,
                    percent_correct: gameCorrect / gameQuestions
                }
            }
        })
    };

    const updateWeeklyStatsState = (gameType, newWeeklyStatistics) => {
        const { correct } = newWeeklyStatistics;

        setWeeklyStats(prevStats => {
            const totalQuestions = prevStats.total.total_questions + 1;
            const totalCorrect = correct ? prevStats.total.State.total_correct + 1 : prevStats.total.total_correct;

            const gameQuestions = prevStats[gameType].total_questions + 1;
            const gameCorrect = correct ? prevStats[gameType].total_correct + 1 : prevStats[gameType].total_correct;

            return {
                ...prevStats,
                total: {
                    total_questions: totalQuestions,
                    total_correct: totalCorrect,
                    percent_correct: totalCorrect / totalQuestions
                },
                [gameType]: {
                    total_questions: gameQuestions,
                    total_correct: gameCorrect,
                    percent_correct: gameCorrect / gameQuestions
                }
            }
        })
    };

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
                console.log('Successful add', data);
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
                console.log('Successful query', data);
                setQueryStatistics(data)
            }
        } catch (error) {
            console.error('Error with function in UserStateContext.jsx:', error)
        }
    }

    const updateStats = async(frequency, inputData) => {
        try {
            const yyyymmdd = getYearMonthDate(frequency)

            const { data, errors } = await dataClient.mutations.updateStats({
                frequency: frequency,
                yyyymmdd: yyyymmdd,
                data: inputData
            });

            if (errors) {
                console.error('Check inputs or CloudWatch logs:', errors);
            } else {
                console.log('Successful update', data);
            }
        } catch (error) {
            console.error('Error with function in UserStatisticsContext.jsx', error)
        }
    }

    return (
        <UserStatisticsContext.Provider value ={{
            dailyStats,
            weeklyStats,
            queryStatistics,
            updateDailyStatsState,
            updateWeeklyStatsState,
            addStats,
            getStats,
            queryStats,
            updateStats,
        }}>
            { children }
        </UserStatisticsContext.Provider>
    );
};

export default UserStatisticsContext