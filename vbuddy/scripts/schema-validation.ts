/**
 * Database Schema Validation Test Script
 *
 * This script checks all database queries in the codebase against the actual
 * database schema to identify potential mismatches and issues.
 */

import * as fs from "fs";
import * as path from "path";

// Database schema definition based on the actual schema provided
const ACTUAL_SCHEMA = {
  jobs: {
    id: "uuid",
    employer_id: "uuid",
    company_id: "uuid",
    title: "text",
    description: "text",
    requirements: "text[]", // ARRAY type
    experience_level: "text",
    hourly_rate_min: "numeric",
    hourly_rate_max: "numeric",
    location: "text",
    is_remote: "boolean",
    status: "text",
    created_at: "timestamp",
    updated_at: "timestamp",
    expires_at: "timestamp",
    category_id: "uuid",
    work_type: "text",
    duration: "text",
    required_skills: "jsonb",
    // Missing fields that code might expect:
    // responsibilities: NOT EXISTS
    // hourly_rate: NOT EXISTS (replaced by min/max)
  },
  employer_profiles: {
    id: "uuid",
    updated_at: "timestamp",
    full_name: "text",
    position: "text",
    company_id: "uuid",
    contact_phone: "text",
    profile_picture_url: "text",
    about_me: "text",
    created_at: "timestamp",
    company_name: "text",
  },
  va_profiles: {
    id: "uuid",
    updated_at: "timestamp",
    full_name: "text",
    profile_picture_url: "text",
    headline: "text",
    about_me: "text",
    contact_phone: "text",
    primary_skills: "jsonb",
    years_of_experience: "integer",
    desired_work_type: "text",
    preferred_hourly_rate: "numeric",
    availability: "text",
    resume_url: "text",
    portfolio_url: "text",
    github_url: "text",
    intro_video_url: "text",
    kyc_status: "text",
    kyc_verified_at: "timestamp",
  },
  job_applications: {
    id: "uuid",
    job_id: "uuid",
    va_id: "uuid",
    status: "text", // CHECK: 'pending', 'reviewed', 'accepted', 'rejected'
    cover_letter: "text",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
  va_time_entries: {
    id: "uuid",
    va_id: "uuid",
    employer_id: "uuid",
    job_id: "uuid",
    reference_id: "varchar",
    status: "varchar",
    submitted_at: "timestamp",
    reviewed_at: "timestamp",
    reviewer_id: "uuid",
    notes: "text",
    start_time: "timestamp",
    end_time: "timestamp",
    duration_hours: "numeric",
    work_description: "text",
  },
  job_categories: {
    id: "uuid",
    name: "varchar",
    description: "text",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
  job_skills: {
    id: "uuid",
    name: "varchar",
    category_id: "uuid",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
  job_skills_mapping: {
    id: "uuid",
    job_id: "uuid",
    skill_id: "uuid",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
  employer_company_profiles: {
    id: "uuid",
    name: "text",
    description: "text",
    website_url: "text",
    logo_url: "text",
    industry: "text",
    company_size: "text",
    location: "text",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
  kyc_verifications: {
    id: "uuid",
    va_id: "uuid",
    status: "text",
    verification_id: "text",
    verification_data: "jsonb",
    documents: "jsonb",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
  messages: {
    id: "uuid",
    sender_id: "uuid",
    receiver_id: "uuid",
    content: "text",
    created_at: "timestamp",
    read: "boolean",
  },
  notifications: {
    id: "uuid",
    user_id: "uuid",
    title: "text",
    message: "text",
    type: "text",
    read: "boolean",
    created_at: "timestamp",
  },
} as const;

// Common problematic queries found in the codebase
const KNOWN_ISSUES = [
  {
    file: "src/app/dashboard/va/jobs/page.tsx",
    issue:
      'Query selects non-existent "responsibilities" column from jobs table',
    line: "~160",
    fix: "Remove responsibilities field from query and interface",
  },
  {
    file: "src/app/dashboard/va/jobs/page.tsx",
    issue: 'Uses single "hourly_rate" instead of "hourly_rate_min/max"',
    line: "~350",
    fix: "Update to use hourly_rate_min and hourly_rate_max fields",
  },
  {
    file: "src/lib/supabase/migrations/20241201000001_add_dashboard_functions.sql",
    issue:
      'Function references non-existent "responsibilities" and "hourly_rate" fields',
    line: "~120",
    fix: "Update function to use correct schema fields",
  },
];

interface QueryIssue {
  file: string;
  line: number;
  issue: string;
  query: string;
  severity: "error" | "warning" | "info";
}

class SchemaValidator {
  private issues: QueryIssue[] = [];

  /**
   * Validate a select query against the schema
   */
  validateSelectQuery(
    file: string,
    line: number,
    table: string,
    selectFields: string
  ): void {
    const tableSchema = ACTUAL_SCHEMA[table as keyof typeof ACTUAL_SCHEMA];

    if (!tableSchema) {
      this.issues.push({
        file,
        line,
        issue: `Table "${table}" does not exist in schema`,
        query: `SELECT ${selectFields} FROM ${table}`,
        severity: "error",
      });
      return;
    }

    // Parse select fields (basic parsing for common patterns)
    if (selectFields === "*") {
      // Wildcard select is usually safe
      return;
    }

    // Extract field names from select clause
    const fields = this.parseSelectFields(selectFields);

    for (const field of fields) {
      if (!this.isValidField(field, table, tableSchema)) {
        this.issues.push({
          file,
          line,
          issue: `Field "${field}" does not exist in table "${table}"`,
          query: `SELECT ${selectFields} FROM ${table}`,
          severity: "error",
        });
      }
    }
  }

  /**
   * Parse select fields from query string
   */
  private parseSelectFields(selectFields: string): string[] {
    // Remove joins and nested selects for basic validation
    const cleanFields = selectFields
      .replace(/\s+/g, " ")
      .replace(/\([^)]*\)/g, "") // Remove function calls
      .split(",")
      .map((f) => f.trim())
      .map((f) => f.split(":")[0]) // Remove aliases (field:alias)
      .map((f) => f.split("(")[0]) // Remove function calls
      .map((f) => f.split(" ")[0]) // Remove AS aliases
      .filter((f) => f && !f.includes("!"));

    return cleanFields;
  }

  /**
   * Check if a field is valid for the given table
   */
  private isValidField(
    field: string,
    table: string,
    tableSchema: Record<string, string>
  ): boolean {
    // Handle special cases
    if (field === "*") return true;
    if (field.includes(".")) return true; // Joined fields
    if (field.startsWith("!")) return true; // Supabase syntax

    return field in tableSchema;
  }

  /**
   * Scan a file for database queries
   */
  scanFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Look for .from("table").select("fields") patterns
      const fromMatch = line.match(/\.from\(["']([^"']+)["']\)/);
      if (fromMatch) {
        const table = fromMatch[1];

        // Look for corresponding select in nearby lines
        for (
          let i = Math.max(0, index - 5);
          i < Math.min(lines.length, index + 10);
          i++
        ) {
          const selectMatch = lines[i].match(/\.select\(["'`]([^"'`]+)["'`]\)/);
          if (selectMatch) {
            const selectFields = selectMatch[1];
            this.validateSelectQuery(filePath, lineNumber, table, selectFields);
            break;
          }
        }
      }

      // Check for known problematic patterns
      this.checkKnownIssues(filePath, lineNumber, line);
    });
  }

  /**
   * Check for known problematic patterns
   */
  private checkKnownIssues(
    filePath: string,
    lineNumber: number,
    line: string
  ): void {
    // Check for responsibilities field usage
    if (
      line.includes("responsibilities") &&
      (line.includes("job") || line.includes("select"))
    ) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue: 'References non-existent "responsibilities" field in jobs table',
        query: line.trim(),
        severity: "error",
      });
    }

    // Check for single hourly_rate usage
    if (
      line.includes("hourly_rate") &&
      !line.includes("hourly_rate_min") &&
      !line.includes("hourly_rate_max")
    ) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue:
          'Uses deprecated "hourly_rate" field instead of "hourly_rate_min/max"',
        query: line.trim(),
        severity: "warning",
      });
    }

    // Check for status values that might be incorrect
    if (line.includes("status = 'hired'")) {
      this.issues.push({
        file: filePath,
        line: lineNumber,
        issue:
          'Uses "hired" status - should be "accepted" according to schema constraints',
        query: line.trim(),
        severity: "warning",
      });
    }
  }

  /**
   * Scan all TypeScript files in the project
   */
  scanProject(rootDir: string): void {
    const scanDir = (dir: string) => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (
          stat.isDirectory() &&
          !file.startsWith(".") &&
          file !== "node_modules"
        ) {
          scanDir(fullPath);
        } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
          this.scanFile(fullPath);
        }
      }
    };

    scanDir(rootDir);
  }

  /**
   * Generate a report of all issues found
   */
  generateReport(): string {
    const errorCount = this.issues.filter((i) => i.severity === "error").length;
    const warningCount = this.issues.filter(
      (i) => i.severity === "warning"
    ).length;
    const infoCount = this.issues.filter((i) => i.severity === "info").length;

    let report = `
# Database Schema Validation Report

## Summary
- **Errors**: ${errorCount}
- **Warnings**: ${warningCount}
- **Info**: ${infoCount}
- **Total Issues**: ${this.issues.length}

## Issues Found

`;

    // Group issues by severity
    const groupedIssues = {
      error: this.issues.filter((i) => i.severity === "error"),
      warning: this.issues.filter((i) => i.severity === "warning"),
      info: this.issues.filter((i) => i.severity === "info"),
    };

    for (const [severity, issues] of Object.entries(groupedIssues)) {
      if (issues.length === 0) continue;

      report += `### ${severity.toUpperCase()}S (${issues.length})\n\n`;

      for (const issue of issues) {
        report += `**${issue.file}:${issue.line}**\n`;
        report += `- Issue: ${issue.issue}\n`;
        report += `- Query: \`${issue.query}\`\n\n`;
      }
    }

    // Add known issues section
    report += `## Known Issues (From Manual Review)\n\n`;
    for (const issue of KNOWN_ISSUES) {
      report += `**${issue.file}** (Line ${issue.line})\n`;
      report += `- Issue: ${issue.issue}\n`;
      report += `- Fix: ${issue.fix}\n\n`;
    }

    // Add schema reference
    report += `## Database Schema Reference\n\n`;
    report += `### Tables and Their Fields\n\n`;

    for (const [table, fields] of Object.entries(ACTUAL_SCHEMA)) {
      report += `**${table}**\n`;
      for (const [field, type] of Object.entries(fields)) {
        report += `- ${field}: ${type}\n`;
      }
      report += "\n";
    }

    return report;
  }

  /**
   * Get issues for programmatic access
   */
  getIssues(): QueryIssue[] {
    return this.issues;
  }
}

// Main execution function
export function validateSchema(projectRoot: string = process.cwd()): string {
  console.log("🔍 Starting database schema validation...");

  const validator = new SchemaValidator();
  validator.scanProject(projectRoot);

  const report = validator.generateReport();
  const issues = validator.getIssues();

  console.log(`✅ Validation complete. Found ${issues.length} issues.`);
  console.log(
    `   - Errors: ${issues.filter((i) => i.severity === "error").length}`
  );
  console.log(
    `   - Warnings: ${issues.filter((i) => i.severity === "warning").length}`
  );
  console.log(
    `   - Info: ${issues.filter((i) => i.severity === "info").length}`
  );

  return report;
}

// CLI execution
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();
  const report = validateSchema(projectRoot);

  // Write report to file
  const reportPath = path.join(projectRoot, "schema-validation-report.md");
  fs.writeFileSync(reportPath, report);

  console.log(`📝 Report written to: ${reportPath}`);

  // Exit with error code if there are errors
  const validator = new SchemaValidator();
  validator.scanProject(projectRoot);
  const errors = validator.getIssues().filter((i) => i.severity === "error");

  if (errors.length > 0) {
    console.error(
      `❌ Found ${errors.length} schema errors. Please fix them before proceeding.`
    );
    process.exit(1);
  } else {
    console.log("✅ No schema errors found!");
  }
}
