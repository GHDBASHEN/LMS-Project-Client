import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Component to display, upload, and manage lesson materials (files).
 * It adapts its UI and functionality based on the user's role.
 *
 * @param {object} props
 * @param {number} props.lessonId - The ID of the current lesson.
 * @param {string} props.userRole - The role of the current user ('lecturer', 'student').
 * @param {string} props.token - The authentication token for the user.
 */
const LessonMaterials = ({ lessonId, userRole, token }) => {
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Create an axios instance with auth headers
    const api = axios.create({
        baseURL: 'http://127.0.0.1:8000/api', // Adjust to your backend URL
        headers: {
            'Authorization': `Token ${token}`
        }
    });

    // Function to fetch files for the lesson
    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get(`/lessons/${lessonId}/files/`);
            setFiles(response.data);
        } catch (err) {
            setError('Failed to fetch lesson materials. Please try again.');
            console.error('Fetch files error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [lessonId, api]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // Handler for file input change
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    // Handler for file upload
    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        setIsLoading(true);
        setError('');
        setUploadProgress(0);

        try {
            await api.post(`/lessons/${lessonId}/files/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });
            // Refresh the file list after successful upload
            fetchFiles();
            setSelectedFile(null); // Clear the selection
        } catch (err) {
            setError('File upload failed. Please try again.');
            console.error('Upload error:', err);
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
        }
    };

    // Handler for deleting a file
    const handleDelete = async (fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) {
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await api.delete(`/lessons/${lessonId}/files/${fileId}/`);
            // Refresh the file list
            fetchFiles();
        } catch (err) {
            setError('Failed to delete file. Please try again.');
            console.error('Delete error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="lesson-materials-container mt-4 p-4 border rounded">
            <h3 className="text-xl font-semibold mb-3">Lesson Materials</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Loading...</p>}

            {/* File List */}
            {files.length > 0 ? (
                <ul className="list-group">
                    {files.map((file) => (
                        <li key={file.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <a href={file.file} target="_blank" rel="noopener noreferrer" className="text-primary">
                                {file.filename} ({(file.file_size / 1024).toFixed(2)} KB)
                            </a>
                            {userRole === 'lecturer' && (
                                <button onClick={() => handleDelete(file.id)} className="btn btn-sm btn-danger">
                                    Delete
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                !isLoading && <p>No materials have been uploaded for this lesson yet.</p>
            )}

            {/* Upload Form for Lecturers */}
            {userRole === 'lecturer' && (
                <div className="upload-form mt-4">
                    <h4 className="text-lg font-semibold mb-2">Upload New Material</h4>
                    <div className="input-group">
                        <input type="file" className="form-control" onChange={handleFileChange} />
                        <button onClick={handleUpload} className="btn btn-success" disabled={!selectedFile || isLoading}>
                            Upload
                        </button>
                    </div>
                    {uploadProgress > 0 && (
                        <div className="progress mt-2">
                            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>{uploadProgress}%</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LessonMaterials;