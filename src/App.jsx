import './App.css';
import { Routes, Route } from "react-router-dom";

import Topbar from "./components/topbar.jsx";
import Sidebar from "./components/sidebar.jsx";

import Overview from "./pages/overview.jsx";
import SkillMap from "./pages/skill_map.jsx";
import Recommendations from "./pages/recommendations.jsx";
import Activity from "./pages/activity.jsx";
import Profile from "./pages/profile.jsx";
import Settings from "./pages/settings.jsx";

import Landing from "./pages/landing.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import NotFound from "./pages/NotFound.jsx";


function DashboardLayout({ children }) {
    return (
        <div className="app">
            <Sidebar />

            <div className="main">
                <Topbar />

                <div className="content">
                    {children}
                </div>
            </div>
        </div>
    );
}


function App() {
    return (
        <Routes>

            {/* Public pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard pages */}
            <Route
                path="/overview"
                element={
                    <DashboardLayout>
                        <Overview />
                    </DashboardLayout>
                }
            />

            <Route
                path="/my-skill-map"
                element={
                    <DashboardLayout>
                        <SkillMap />
                    </DashboardLayout>
                }
            />

            <Route
                path="/recommendations"
                element={
                    <DashboardLayout>
                        <Recommendations />
                    </DashboardLayout>
                }
            />

            <Route
                path="/activity"
                element={
                    <DashboardLayout>
                        <Activity />
                    </DashboardLayout>
                }
            />

            <Route
                path="/profile"
                element={
                    <DashboardLayout>
                        <Profile />
                    </DashboardLayout>
                }
            />

            <Route
                path="/setting"
                element={
                    <DashboardLayout>
                        <Settings />
                    </DashboardLayout>
                }
            />

            {/* Invalid URL */}
            <Route path="*" element={<NotFound />} />

        </Routes>
    );
}

export default App;