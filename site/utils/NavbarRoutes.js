export const guardianRoutes = [
    {name: "Ana Sayfa", route: "/guardian"},
    {name: "Takvim", route: "/guardian/schedule"},
    {name: "Dersler", route: "/guardian/lessons"},
    {name: "Ödevler", route: "/guardian/assignments"},
    {name: "Ödemeler", route: "/guardian/payments"},
    {name: "Öğrenciler", route: "/guardian/students"},
    {name: "Mesajlar", route: "/guardian/messages"}
];

export const studentRoutes = [
    {name: "Ana Sayfa", route: "/student"},
    {name: "Dersler", route: "/student/lessons"},
    {name: "Ödevler", route: "/student/assignments"},
    {name: "Öğretmenler", route: "/student/teachers"},
    {name: "Veliler", route: "/student/guardians"},
    {name: "Mesajlar", route: "/student/messages"}
];

export const teacherRoutes = [
    {name: "Ana Sayfa", route: "/teacher"},
    {name: "Takvim", route: "/teacher/schedule"},
    {name: "Dersler", route: "/teacher/lessons"},
    {name: "Ödevler", route: "/teacher/assignments"},
    {name: "Ödemeler", route: "/teacher/payments"},
    {name: "Öğrenciler", route: "/teacher/students"},
    {name: "Mesajlar", route: "/teacher/messages"},
    {name: "Notlar", route: "/teacher/notes"}
];