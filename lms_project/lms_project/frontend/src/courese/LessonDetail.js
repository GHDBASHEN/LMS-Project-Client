import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import LessonMaterials from './LessonMaterials'; // Import the new component

/**
 * A page component to display the full details of a lesson,
 * including its content and downloadable materials.
 */
const LessonDetail = () => {
    const { lessonId } = useParams(); // Get lessonId from URL, e.g., /lessons/12
    const [lesson, setLesson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Get auth data from localStorage
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    useEffect(() => {
        const fetchLessonContent = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/lessons/${lessonId}/content/`, {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });
                setLesson(response.data);
            } catch (err) {
                setError('Failed to load lesson content. You may not be enrolled in this course.');
                console.error('Fetch lesson error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (lessonId && token) {
            fetchLessonContent();
        }
    }, [lessonId, token]);

    if (isLoading) {
        return <div className="container mt-5"><p>Loading lesson...</p></div>;
    }

    if (error) {
        return <div className="container mt-5 alert alert-danger">{error}</div>;
    }

    if (!lesson) {
        return <div className="container mt-5"><p>Lesson not found.</p></div>;
    }

    return (
        <div className="container mt-5">
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title text-2xl font-bold">{lesson.title}</h1>
                    <p className="text-muted-foreground">{lesson.lesson_type.charAt(0).toUpperCase() + lesson.lesson_type.slice(1)} - {lesson.duration_minutes} minutes</p>
                </div>
                <div className="card-body">
                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                    <LessonMaterials lessonId={lesson.id} userRole={userRole} token={token} />
                </div>
            </div>
        </div>
    );
};

export default LessonDetail;