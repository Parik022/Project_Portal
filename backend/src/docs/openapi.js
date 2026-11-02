// OpenAPI 3 description of the ProjectFlow API, served at /api/docs.
// Kept in one file so it is easy to update alongside the routes.

const ok = (description, example) => ({
  description,
  content: { "application/json": { example: { success: true, message: description, data: example } } },
});

const err = (description) => ({ $ref: `#/components/responses/${description}` });

const body = (schemaRef, example) => ({
  required: true,
  content: { "application/json": { schema: { $ref: `#/components/schemas/${schemaRef}` }, ...(example ? { example } : {}) } },
});

const idParam = (name = "id") => ({ name, in: "path", required: true, schema: { type: "string" } });
const q = (name, schema, description) => ({ name, in: "query", required: false, schema, description });
const pageParams = [q("page", { type: "integer", default: 1 }), q("limit", { type: "integer", default: 20, maximum: 100 })];

const secured = { security: [{ bearerAuth: [] }] };
const common = { 401: err("Unauthorized"), 403: err("Forbidden") };

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "ProjectFlow API",
    version: "1.0.0",
    description:
      "Academic project and internship attendance portal for SRM. Students mark daily attendance remotely and submit weekly reports; faculty guides verify and review; HODs monitor their department; admins manage users.\n\n" +
      "**Try it:** call `POST /auth/login` with a seed account, copy `data.token`, click **Authorize** and paste it.\n\n" +
      "All responses use `{ success, message, data }`; errors use `{ success: false, message, errors }`.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Auth" },
    { name: "Users", description: "Admin and HOD user management" },
    { name: "Internships" },
    { name: "Attendance", description: "Daily remote check-in and guide verification" },
    { name: "Submissions", description: "Weekly progress reports" },
    { name: "Projects" },
    { name: "Teams" },
    { name: "Notifications" },
    { name: "Dashboard" },
    { name: "System" },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    responses: {
      ValidationError: {
        description: "Validation failed",
        content: {
          "application/json": {
            example: { success: false, message: "Validation failed", errors: { email: ["Use your @srmist.edu.in email address"] } },
          },
        },
      },
      Unauthorized: {
        description: "Missing, invalid or expired token",
        content: { "application/json": { example: { success: false, message: "Authentication required", errors: null } } },
      },
      Forbidden: {
        description: "Logged in but not allowed",
        content: {
          "application/json": {
            example: { success: false, message: "You do not have permission to perform this action", errors: null },
          },
        },
      },
      NotFound: {
        description: "Not found or not visible to you",
        content: { "application/json": { example: { success: false, message: "Not found", errors: null } } },
      },
      Conflict: {
        description: "Duplicate record",
        content: {
          "application/json": { example: { success: false, message: "Attendance already marked for today", errors: null } },
        },
      },
    },
    schemas: {
      Register: {
        type: "object",
        required: ["name", "email", "password", "role", "department"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email", description: "Must end with @srmist.edu.in" },
          password: { type: "string", minLength: 8, description: "At least 8 characters with a letter and a number" },
          role: { type: "string", enum: ["STUDENT", "FACULTY"] },
          registerNo: { type: "string", description: "Required for students, e.g. RA2411030010438" },
          department: { type: "string" },
        },
      },
      Login: {
        type: "object",
        required: ["email", "password"],
        properties: { email: { type: "string" }, password: { type: "string" } },
      },
      UpdateProfile: { type: "object", properties: { name: { type: "string" }, department: { type: "string" } } },
      ChangePassword: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: { currentPassword: { type: "string" }, newPassword: { type: "string" } },
      },
      CreateUser: {
        allOf: [
          { $ref: "#/components/schemas/Register" },
          { type: "object", properties: { role: { type: "string", enum: ["STUDENT", "FACULTY", "HOD", "ADMIN"] } } },
        ],
      },
      UpdateUser: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string", enum: ["STUDENT", "FACULTY", "HOD", "ADMIN"] },
          department: { type: "string" },
          registerNo: { type: "string", nullable: true },
          isActive: { type: "boolean", description: "Set true to approve a faculty account" },
        },
      },
      AssignGuide: { type: "object", required: ["guideId"], properties: { guideId: { type: "string", nullable: true } } },
      Internship: {
        type: "object",
        required: ["company", "position", "startDate", "endDate"],
        properties: {
          company: { type: "string" },
          position: { type: "string" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          mode: { type: "string", enum: ["ONSITE", "REMOTE"], default: "REMOTE" },
        },
      },
      MarkAttendance: {
        type: "object",
        required: ["mode", "summary"],
        properties: {
          mode: { type: "string", enum: ["ONSITE", "REMOTE"] },
          summary: { type: "string", minLength: 10, description: "What you worked on today" },
        },
      },
      VerifyAttendance: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["VERIFIED", "REJECTED"] },
          remark: { type: "string", description: "Required when rejecting" },
        },
      },
      CreateSubmission: {
        type: "object",
        required: ["weekNumber", "title", "description"],
        properties: {
          weekNumber: { type: "integer", minimum: 1 },
          title: { type: "string" },
          description: { type: "string" },
          link: { type: "string", format: "uri", description: "GitHub, Drive or other link" },
        },
      },
      UpdateSubmission: {
        type: "object",
        properties: { title: { type: "string" }, description: { type: "string" }, link: { type: "string", nullable: true } },
      },
      ReviewSubmission: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["APPROVED", "CHANGES_REQUESTED"] },
          feedback: { type: "string", description: "Required when requesting changes" },
        },
      },
      Project: {
        type: "object",
        required: ["title", "description"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          progressPercentage: { type: "integer", minimum: 0, maximum: 100 },
        },
      },
      CreateTeam: { type: "object", required: ["name", "projectId"], properties: { name: { type: "string" }, projectId: { type: "string" } } },
      AssignStudent: {
        type: "object",
        required: ["studentId", "teamId"],
        properties: { studentId: { type: "string" }, teamId: { type: "string" } },
      },
    },
  },
  paths: {
    "/health": {
      get: { tags: ["System"], summary: "Health check (API + database)", responses: { 200: ok("ProjectFlow API is running", { database: "up" }) } },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a student or faculty account",
        description: "Students can log in immediately. Faculty accounts are created inactive until an admin approves them.",
        requestBody: body("Register", {
          name: "Siddharth Sengupta",
          email: "ss1234@srmist.edu.in",
          password: "Password123",
          role: "STUDENT",
          registerNo: "RA2411030010438",
          department: "CSE",
        }),
        responses: {
          201: ok("Registration successful", { user: { id: "c...", role: "STUDENT" }, token: "eyJ..." }),
          400: err("ValidationError"),
          409: err("Conflict"),
          429: { description: "Too many sign-up attempts" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        description: "Rate-limited to 5 attempts per minute per IP.",
        requestBody: body("Login", { email: "student1@srmist.edu.in", password: "Password123" }),
        responses: {
          200: ok("Login successful", { user: { id: "c...", role: "STUDENT" }, token: "eyJ..." }),
          400: err("ValidationError"),
          401: { description: "Invalid email or password" },
          403: { description: "Account inactive or awaiting approval" },
          429: { description: "Too many login attempts" },
        },
      },
    },
    "/auth/logout": { post: { tags: ["Auth"], ...secured, summary: "Log out (client discards the token)", responses: { 200: ok("Logged out", null), ...common } } },
    "/auth/profile": {
      get: { tags: ["Auth"], ...secured, summary: "Current user with guide, internship and team", responses: { 200: ok("Profile retrieved", {}), ...common } },
      patch: { tags: ["Auth"], ...secured, summary: "Update own name or department", requestBody: body("UpdateProfile"), responses: { 200: ok("Profile updated", {}), 400: err("ValidationError"), ...common } },
    },
    "/auth/password": {
      patch: { tags: ["Auth"], ...secured, summary: "Change own password", requestBody: body("ChangePassword"), responses: { 200: ok("Password changed", { changed: true }), 400: err("ValidationError"), ...common } },
    },
    "/users": {
      get: {
        tags: ["Users"],
        ...secured,
        summary: "List users (admin: all, HOD: own department)",
        parameters: [
          ...pageParams,
          q("role", { type: "string", enum: ["STUDENT", "FACULTY", "HOD", "ADMIN"] }),
          q("search", { type: "string" }, "Name, email or register number"),
          q("isActive", { type: "string", enum: ["true", "false"] }),
          q("department", { type: "string" }, "Admin only"),
          q("guideId", { type: "string" }),
        ],
        responses: { 200: ok("Users retrieved", { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }), ...common },
      },
      post: { tags: ["Users"], ...secured, summary: "Admin creates any account (e.g. HOD)", requestBody: body("CreateUser"), responses: { 201: ok("User created", {}), 400: err("ValidationError"), 409: err("Conflict"), ...common } },
    },
    "/users/{id}": {
      get: { tags: ["Users"], ...secured, summary: "Get one user", parameters: [idParam()], responses: { 200: ok("User retrieved", {}), 404: err("NotFound"), ...common } },
      patch: {
        tags: ["Users"],
        ...secured,
        summary: "Admin edits a user, approves faculty (isActive: true) or changes role",
        parameters: [idParam()],
        requestBody: body("UpdateUser"),
        responses: { 200: ok("User updated", {}), 400: err("ValidationError"), 404: err("NotFound"), ...common },
      },
      delete: { tags: ["Users"], ...secured, summary: "Deactivate a user (soft delete)", parameters: [idParam()], responses: { 200: ok("User deactivated", {}), 404: err("NotFound"), ...common } },
    },
    "/users/{id}/guide": {
      patch: { tags: ["Users"], ...secured, summary: "Assign a faculty guide to a student", parameters: [idParam()], requestBody: body("AssignGuide"), responses: { 200: ok("Guide assigned", {}), 400: err("ValidationError"), 404: err("NotFound"), ...common } },
    },
    "/internships/me": {
      get: { tags: ["Internships"], ...secured, summary: "Student: own internship details", responses: { 200: ok("Internship retrieved", {}), ...common } },
      put: {
        tags: ["Internships"],
        ...secured,
        summary: "Student: create or update internship details",
        requestBody: body("Internship", { company: "Zoho", position: "Backend Intern", startDate: "2026-10-01", endDate: "2026-12-31", mode: "REMOTE" }),
        responses: { 200: ok("Internship saved", {}), 400: err("ValidationError"), ...common },
      },
    },
    "/attendance": {
      post: {
        tags: ["Attendance"],
        ...secured,
        summary: "Student: mark today's attendance (remote or on-site)",
        description: "One record per student per day (IST). Monday–Friday only, within the internship period. Starts as PENDING until the guide verifies it.",
        requestBody: body("MarkAttendance", { mode: "REMOTE", summary: "Built the login API and wrote tests" }),
        responses: { 201: ok("Attendance marked", {}), 400: err("ValidationError"), 409: err("Conflict"), ...common },
      },
      get: {
        tags: ["Attendance"],
        ...secured,
        summary: "List attendance records in your scope",
        description: "Student: own. Faculty: their guided students. HOD: department. Admin: all.",
        parameters: [
          ...pageParams,
          q("studentId", { type: "string" }),
          q("status", { type: "string", enum: ["PENDING", "VERIFIED", "REJECTED"] }),
          q("from", { type: "string", format: "date" }),
          q("to", { type: "string", format: "date" }),
        ],
        responses: { 200: ok("Attendance records retrieved", { items: [], pagination: {} }), 400: err("ValidationError"), ...common },
      },
    },
    "/attendance/stats": {
      get: { tags: ["Attendance"], ...secured, summary: "Student: own %, present/absent/pending. Others: scope totals", responses: { 200: ok("Attendance stats retrieved", { percentage: 92, present: 23, absent: 2, pending: 1 }), ...common } },
    },
    "/attendance/report": {
      get: {
        tags: ["Attendance"],
        ...secured,
        summary: "Per-student attendance report (JSON or CSV)",
        parameters: [q("format", { type: "string", enum: ["json", "csv"] })],
        responses: { 200: ok("Attendance report retrieved", []), ...common },
      },
    },
    "/attendance/summary/{studentId}": {
      get: { tags: ["Attendance"], ...secured, summary: "One student's attendance summary", parameters: [idParam("studentId")], responses: { 200: ok("Attendance summary retrieved", {}), 404: err("NotFound"), ...common } },
    },
    "/attendance/{id}/verify": {
      patch: {
        tags: ["Attendance"],
        ...secured,
        summary: "Guide or admin verifies or rejects a record",
        parameters: [idParam()],
        requestBody: body("VerifyAttendance", { status: "VERIFIED" }),
        responses: { 200: ok("Attendance verified", {}), 400: err("ValidationError"), 404: err("NotFound"), ...common },
      },
    },
    "/submissions": {
      get: { tags: ["Submissions"], ...secured, summary: "List weekly reports in your scope", responses: { 200: ok("Submissions retrieved", []), ...common } },
      post: {
        tags: ["Submissions"],
        ...secured,
        summary: "Student: submit a weekly progress report",
        requestBody: body("CreateSubmission", { weekNumber: 3, title: "Week 3", description: "Finished attendance API", link: "https://github.com/..." }),
        responses: { 201: ok("Report submitted", {}), 400: err("ValidationError"), 409: err("Conflict"), ...common },
      },
    },
    "/submissions/{id}": {
      get: { tags: ["Submissions"], ...secured, summary: "Get one report", parameters: [idParam()], responses: { 200: ok("Submission retrieved", {}), 404: err("NotFound"), ...common } },
      patch: { tags: ["Submissions"], ...secured, summary: "Student: edit or resubmit a report that isn't approved yet", parameters: [idParam()], requestBody: body("UpdateSubmission"), responses: { 200: ok("Report updated", {}), 400: err("ValidationError"), 404: err("NotFound"), ...common } },
    },
    "/submissions/{id}/review": {
      patch: {
        tags: ["Submissions"],
        ...secured,
        summary: "Faculty: approve or request changes with feedback",
        parameters: [idParam()],
        requestBody: body("ReviewSubmission", { status: "CHANGES_REQUESTED", feedback: "Add test results for the login API" }),
        responses: { 200: ok("Report reviewed", {}), 400: err("ValidationError"), 404: err("NotFound"), ...common },
      },
    },
    "/projects": {
      get: { tags: ["Projects"], ...secured, summary: "List projects in your scope", responses: { 200: ok("Projects retrieved", []), ...common } },
      post: { tags: ["Projects"], ...secured, summary: "Faculty: create a project", requestBody: body("Project"), responses: { 201: ok("Project created", {}), 400: err("ValidationError"), ...common } },
    },
    "/projects/{id}": {
      get: { tags: ["Projects"], ...secured, summary: "Get one project", parameters: [idParam()], responses: { 200: ok("Project retrieved", {}), 404: err("NotFound"), ...common } },
      put: { tags: ["Projects"], ...secured, summary: "Faculty: update own project", parameters: [idParam()], requestBody: body("Project"), responses: { 200: ok("Project updated", {}), 404: err("NotFound"), ...common } },
      delete: { tags: ["Projects"], ...secured, summary: "Faculty: delete own project", parameters: [idParam()], responses: { 200: ok("Project deleted", {}), 404: err("NotFound"), ...common } },
    },
    "/teams": {
      get: { tags: ["Teams"], ...secured, summary: "List teams in your scope", parameters: [q("projectId", { type: "string" })], responses: { 200: ok("Teams retrieved", []), ...common } },
      post: { tags: ["Teams"], ...secured, summary: "Faculty: create a team", requestBody: body("CreateTeam"), responses: { 201: ok("Team created", {}), 400: err("ValidationError"), ...common } },
    },
    "/teams/available-students": {
      get: { tags: ["Teams"], ...secured, summary: "Faculty: active students not yet on a team", responses: { 200: ok("Available students retrieved", []), ...common } },
    },
    "/teams/assign": {
      post: { tags: ["Teams"], ...secured, summary: "Faculty: add a student to a team (max 4)", requestBody: body("AssignStudent"), responses: { 200: ok("Student assigned to team", {}), 400: err("ValidationError"), 409: err("Conflict"), ...common } },
    },
    "/teams/{id}/members/{studentId}": {
      delete: { tags: ["Teams"], ...secured, summary: "Faculty: remove a student from a team", parameters: [idParam(), idParam("studentId")], responses: { 200: ok("Student removed from team", {}), 404: err("NotFound"), ...common } },
    },
    "/notifications": {
      get: {
        tags: ["Notifications"],
        ...secured,
        summary: "Own notifications with unread count",
        parameters: [...pageParams, q("unread", { type: "string", enum: ["true", "false"] })],
        responses: { 200: ok("Notifications retrieved", { items: [], unreadCount: 0, pagination: {} }), ...common },
      },
    },
    "/notifications/read-all": {
      patch: { tags: ["Notifications"], ...secured, summary: "Mark all as read", responses: { 200: ok("All notifications marked as read", { updated: 3 }), ...common } },
    },
    "/notifications/{id}/read": {
      patch: { tags: ["Notifications"], ...secured, summary: "Mark one as read", parameters: [idParam()], responses: { 200: ok("Notification marked as read", {}), 404: err("NotFound"), ...common } },
    },
    "/notifications/{id}": {
      delete: { tags: ["Notifications"], ...secured, summary: "Delete one", parameters: [idParam()], responses: { 200: ok("Notification deleted", {}), 404: err("NotFound"), ...common } },
    },
    "/dashboard": {
      get: { tags: ["Dashboard"], ...secured, summary: "Role-specific dashboard data", responses: { 200: ok("Dashboard retrieved", { role: "HOD", stats: {} }), ...common } },
    },
  },
};
