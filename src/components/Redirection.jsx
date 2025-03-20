import { useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect } from "react";
import UserContext from "../context/UserContext";
import UserStatisticsContext from "../context/UserStatisticsContext"

const Redirection = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth } = useContext(UserContext);
    const { userStats, setUserStats, dailyStats, setDailyStats, weeklyStats, setWeeklyStats,
        queryStats, addStats, parseNestedJson, updateStreak, formatDate } = useContext(UserStatisticsContext)
    
    useEffect(() => {
        const handleRedirection = async () => {
            const isAuth = await checkAuth();
            console.log("Authenticated", isAuth)
            if (!isAuth) {
                navigate("/", { state: { from: location.pathname } });
            }

            if (isAuth) {
                const stats = await queryStats("", 1)
                const daily = await queryStats("daily", 1)
                const weekly = await queryStats("weekly", 1)
    
                if (stats) {
                  setUserStats(parseNestedJson(stats[0]))
                } else {
                  addStats("", JSON.stringify(userStats))
                }
    
                if (daily) {
                  if (formatDate(daily[0].updated_at) < formatDate(Date.now())) {
                    const newStats = updateStreak(daily[0])
                    setDailyStats(parseNestedJson(newStats))
                  } else {
                    setDailyStats(parseNestedJson(daily[0]))
                  }
                } else {
                  addStats("daily", JSON.stringify(dailyStats))
                } 
    
                if (weekly) {
                  if (formatDate(daily[0].updated_at) < formatDate(Date.now())) {
                    const newStats = updateStreak(weekly[0])
                    setWeeklyStats(parseNestedJson(newStats))
                  } else {
                    setWeeklyStats(parseNestedJson(weekly[0]))
                  }
                } else {
                  addStats("weekly", JSON.stringify(weeklyStats))
                } 
            }

            if (isAuth && location.pathname === "/") {
                navigate("/dashboard")
            }
        };
        
        handleRedirection();
    }, [location.pathname]);

    return children;
};

export default Redirection;

