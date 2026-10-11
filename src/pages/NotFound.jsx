import './notfound.css';
import { Link } from 'react-router-dom';

function NotFound() {
    return (
        <div className="notfound-page">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>

            <Link to="/overview" className="notfound-btn">
                Back to Overview
            </Link>
        </div>
    );
}

export default NotFound;