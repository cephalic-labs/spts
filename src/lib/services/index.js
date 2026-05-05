// Export all services
export { default as userService } from "./userService";
export { default as eventService } from "./eventService";
export { default as odRequestService } from "./odRequestService";
export { default as studentService } from "./studentService";
export { default as facultyService } from "./facultyService";
export { default as eventParticipationService } from "./eventParticipationService";
export { default as odQuotaService } from "./odQuotaService";
export { default as nirfCollegeService } from "./nirfCollegeService";

// Re-export individual functions for convenience
export * from "./userService";
export * from "./eventService";
export * from "./odRequestService";
export * from "./studentService";
export * from "./facultyService";
export * from "./eventParticipationService";
export * from "./odQuotaService";
export * from "./nirfCollegeService";
