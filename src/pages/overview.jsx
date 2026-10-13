import './overview.css'
import {MdCode} from "react-icons/md";
import { Link } from "react-router-dom";
import { useEffect,useState } from "react";
import {
    getActivityData,
    ACTIVITY_EVENT
} from "../data/activityData";


function Overview(){
    const [data, setData] = useState(() => getActivityData());

    useEffect(() => {
        function refreshActivityData() {
            setData(getActivityData());
        }

        window.addEventListener(ACTIVITY_EVENT, refreshActivityData);
        window.addEventListener("storage", refreshActivityData);

        return () => {
            window.removeEventListener(ACTIVITY_EVENT, refreshActivityData);
            window.removeEventListener("storage", refreshActivityData);
        };
    }, []);
    const user = {
        name:"Shaili"
    };
    const hour= new Date().getHours();
    let greeting;
    if(hour<12){
        greeting = "Good morning";
    }
    else if(hour<17){
        greeting = "Good afternoon";
    }
    else{
        greeting = "Good evening";
    }
    return(
        <div className="overview">
            <h1>{greeting},{user.name}!</h1>
            <p>You solve.We analyse.You improve.</p>
            <div className='cards'>
                <div className="stat_cards">

                    <Link to="/activity" className="stat-card-link">
                        <div className="problems_solve">
                            <div className="icon">
                                <MdCode size={35} />
                            </div>
                            <div className="problems_solve_text">
                                <p className="title">Problems solved</p>
                                <p className="number">{data.problemsSolved}</p>
                                <p className="subtitle">Across platforms</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/recommendations" className="stat-card-link">
                        <div className="problems_solve">
                            <div className="icon">
                                <MdCode size={35} />
                            </div>
                            <div className="problems_solve_text">
                                <p className="title">Accuracy</p>
                                <p className="number">{data.accuracy}%</p>
                                <p className="subtitle">(+6% this month)</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/activity" className="stat-card-link">
                        <div className="problems_solve">
                            <div className="icon">
                                <MdCode size={35} />
                            </div>
                            <div className="problems_solve_text">
                                <p className="title">Current Streak</p>
                                <p className="number">{data.currentStreak} days</p>
                                <p className="subtitle">Keep going!</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/activity" className="stat-card-link">
                        <div className="problems_solve">
                            <div className="icon">
                                <MdCode size={35} />
                            </div>
                            <div className="problems_solve_text">
                                <p className="title">Total Time</p>
                                <p className="number">{Math.floor(data.totalMinutes / 60)} hrs</p>
                                <p className="subtitle">Time spent solving</p>
                            </div>
                        </div>
                    </Link>

                </div>
                <div className='recommandation_box'>
                    <div className='recommandation_box_text'>
                        <p className='tagline'>Your Next Step</p>
                        <p className='qtype'>Practice Sliding Window</p>
                        <p className='para_why'>You've solved 4 easy problems but struggled in recent medium ones.
                            DSAForge recommends 3 medium problems to strengthen this concept
                            before moving to Two Pointer.
                        </p>
                        <Link to="/recommendations" className="overview-recommendation-btn">
                            View Recommended Problems →
                        </Link>
                    </div>
                <div>
                        
                    </div>
                </div>
            </div>
        </div>

    )
}

export default Overview