import { useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect } from "react";
import UserContext from "../context/UserContext";

const Redirection = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth } = useContext(UserContext);
    
    useEffect(() => {
        const handleRedirection = async () => {
            const isAuth = await checkAuth();
            console.log("Authenticated", isAuth)
            if (!isAuth) {
                navigate("/", { state: { from: location.pathname } });
            }

            if (isAuth && location.pathname == "/") {
                navigate("/dashboard")
            }
        };
        
        handleRedirection();
    }, [location.pathname, navigate]);

    return children;
};

export default Redirection;

