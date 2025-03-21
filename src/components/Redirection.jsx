import { useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useRef } from "react";
import UserContext from "../context/UserContext";
import UserStatisticsContext from "../context/UserStatisticsContext"

const Redirection = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth } = useContext(UserContext);
    const { handleLoginStats } = useContext(UserStatisticsContext)
    const initStatsRef = useRef(true)
    
    useEffect(() => {
        const handleRedirection = async () => {
            const isAuth = await checkAuth();
            console.log("Authenticated", isAuth)
            console.log("Path name", location.pathname)
            if (!isAuth) {
                navigate("/", { state: { from: location.pathname } });
            }

            if (isAuth && initStatsRef.current) {
                handleLoginStats();
                initStatsRef.current = false
            }

            if (isAuth && location.pathname === "/") {
                navigate("/dashboard");
                handleLoginStats()
            }
        };
        
        handleRedirection();
    }, [location.pathname]);

    return children;
};

export default Redirection;

