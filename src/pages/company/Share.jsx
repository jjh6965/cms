    import { Link } from 'react-router-dom';
    import { FaHome } from 'react-icons/fa';
    import '../company/Share.css';



    export default function Company({ paths }) {
        return (
            <nav className='company-container'>
                <ul>
                    <li>
                        <Link to='/'><FaHome /></Link>
                    </li>
                    {paths.map((item, index) => (
                        <li key={index}>
                            <span>&gt;</span>
                            {item.link ? (
                                <Link to={item.link}>{item.label}</Link>
                            ) : (
                                <span className='current'>{item.label}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        );
    }