// const handleCreateLecturer = async () => {
//     const lecturerData = { username, email, password };
//     const token = localStorage.getItem('token');

//     const res = await fetch('http://127.0.0.1:8000/api/create-lecturer/', {
//         method: 'POST',
//         headers: { 
//             'Content-Type': 'application/json',
//             'Authorization': `Token ${token}`
//         },
//         body: JSON.stringify(lecturerData)
//     });

//     const data = await res.json();
//     alert(data.message || data.error);
// }
