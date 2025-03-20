import { useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect } from "react";
import UserContext from "../context/UserContext";
import UserStatisticsContext from "../context/UserStatisticsContext"

const Redirection = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth } = useContext(UserContext);
    const { handleLoginStats } = useContext(UserStatisticsContext)
    
    useEffect(() => {
        const handleRedirection = async () => {
            const isAuth = await checkAuth();
            console.log("Authenticated", isAuth)
            if (!isAuth) {
                navigate("/", { state: { from: location.pathname } });
            }

            if (isAuth) {
                handleLoginStats()
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

