const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");

let students = [
  {
    id: "1",
    name: "Ahmed Hassan",
    email: "ahmed@iti.edu",
    age: 22,
    major: "Computer Science",
  },
  {
    id: "2",
    name: "Fatma Ali",
    email: "fatma@iti.edu",
    age: 21,
    major: "Information Systems",
  },
];

let courses = [
  {
    id: "1",
    title: "Data Structures",
    code: "CS201",
    credits: 3,
    instructor: "Dr. Mohamed",
  },
  {
    id: "2",
    title: "Database Systems",
    code: "CS301",
    credits: 4,
    instructor: "Dr. Sarah",
  },
];

let enrollments = {
  1: ["1", "2"],
  2: ["2"],
};

function getNextId(list) {
  return String(list.length + 1);
}

const typeDefs = gql`
  type Student {
    id: ID!
    name: String!
    email: String!
    age: Int!
    major: String
    courses: [Course!]!
  }

  type Course {
    id: ID!
    title: String!
    code: String!
    credits: Int!
    instructor: String!
    students: [Student!]!
  }

  type Query {
    getAllStudents: [Student!]!
    getStudent(id: ID!): Student
    getAllCourses: [Course!]!
    getCourse(id: ID!): Course
    searchStudentsByMajor(major: String!): [Student!]!
  }

  type Mutation {
    addStudent(
      name: String!
      email: String!
      age: Int!
      major: String
    ): Student!
    updateStudent(
      id: ID!
      name: String
      email: String
      age: Int
      major: String
    ): Student
    deleteStudent(id: ID!): Boolean!

    addCourse(
      title: String!
      code: String!
      credits: Int!
      instructor: String!
    ): Course!
    updateCourse(
      id: ID!
      title: String
      code: String
      credits: Int
      instructor: String
    ): Course
    deleteCourse(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    getAllStudents: () => students,

    getStudent: (_, { id }) => students.find((stu) => stu.id === id),

    getAllCourses: () => courses,

    getCourse: (_, { id }) => courses.find((c) => c.id === id),

    searchStudentsByMajor: (_, { major }) =>
      students.filter(
        (stu) => stu.major && stu.major.toLowerCase() === major.toLowerCase()
      ),
  },

  Mutation: {
    addStudent: (_, { name, email, age, major }) => {
      const newStudent = {
        id: getNextId(students),
        name,
        email,
        age,
        major: major || null,
      };
      students.push(newStudent);
      enrollments[newStudent.id] = [];
      return newStudent;
    },

    updateStudent: (_, { id, name, email, age, major }) => {
      const st = students.find((s) => s.id === id);
      if (!st) return null;

      if (name !== undefined) st.name = name;
      if (email !== undefined) st.email = email;
      if (age !== undefined) st.age = age;
      if (major !== undefined) st.major = major;

      return st;
    },

    deleteStudent: (_, { id }) => {
      const before = students.length;
      students = students.filter((s) => s.id !== id);
      delete enrollments[id];
      return students.length < before;
    },

    addCourse: (_, { title, code, credits, instructor }) => {
      const newCourse = {
        id: getNextId(courses),
        title,
        code,
        credits,
        instructor,
      };
      courses.push(newCourse);
      return newCourse;
    },

    updateCourse: (_, { id, title, code, credits, instructor }) => {
      const course = courses.find((c) => c.id === id);
      if (!course) return null;

      if (title !== undefined) course.title = title;
      if (code !== undefined) course.code = code;
      if (credits !== undefined) course.credits = credits;
      if (instructor !== undefined) course.instructor = instructor;

      return course;
    },

    deleteCourse: (_, { id }) => {
      const before = courses.length;
      courses = courses.filter((c) => c.id !== id);

      for (let sid in enrollments) {
        enrollments[sid] = enrollments[sid].filter((cid) => cid !== id);
      }

      return courses.length < before;
    },
  },

  Student: {
    courses: (parent) => {
      const courseIds = enrollments[parent.id] || [];
      return courses.filter((c) => courseIds.includes(c.id));
    },
  },

  Course: {
    students: (parent) => {
      const result = [];

      for (let sid in enrollments) {
        if (enrollments[sid].includes(parent.id)) {
          let student = students.find((s) => s.id === sid);
          if (student) result.push(student);
        }
      }

      return result;
    },
  },
};

async function start() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  app.listen(5000, () => {
    console.log("App Running on http://localhost:5000/graphql");
  });
}

start();
