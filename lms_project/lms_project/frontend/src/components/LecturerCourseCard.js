import React from 'react';
import { Link } from 'react-router-dom';

const LecturerCourseCard = ({ course }) => {
    const defaultImage = 'https://via.placeholder.com/300x200.png?text=Course';

    return (
        <div className="col-md-4 mb-4">
            <div className="card h-100">
                <img 
                    src={course.image || defaultImage} 
                    className="card-img-top" 
                    alt={course.title} 
                    style={{ height: '200px', objectFit: 'cover' }} 
                />
                <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{course.title}</h5>
                    <p className="card-text text-muted">Students: {course.enrollment_count}</p>
                    <div className="mt-auto">
                        <Link to={`/course/${course.id}/manage`} className="btn btn-primary w-100">Manage Content</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LecturerCourseCard;