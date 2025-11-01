import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import LecturerCourseCard from '../components/LecturerCourseCard'; // We will create this next

const LecturerDashboard = () => {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLecturerCourses = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found. Please log in.');
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://127.0.0.1:8000/api/lecturer/courses/', {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });
                // The API now returns an array directly
                setCourses(response.data);
            } catch (err) {
                console.error('Failed to fetch lecturer courses:', err);
                setError('Failed to load your courses. You may not have any courses assigned or there was a server error.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLecturerCourses();
    }, []);

    if (isLoading) {
        return <div className="container mt-5"><p>Loading your courses...</p></div>;
    }

    if (error) {
        return <div className="container mt-5 alert alert-danger">{error}</div>;
    }

    return (
        <div className="container mt-5">
            <h1 className="mb-4">My Courses</h1>
            {courses.length > 0 ? (
                <div className="row">
                    {courses.map(course => (
                        <LecturerCourseCard key={course.id} course={course} />
                    ))}
                </div>
            ) : (
                <p>You are not assigned to any courses yet.</p>
            )}
        </div>
    );
};

export default LecturerDashboard;