#!/usr/bin/env node

/**
 * Database Schema Validation Script (JavaScript version)
 *
 * Run with: node scripts/run-schema-validation.js
 */

const fs = require("fs");
const path = require("path");

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
  // Views (not actual tables but accessible via Supabase)
  va_job_employers: {
    job_id: "uuid",
    job_title: "text",
    employer_id: "uuid",
    employer_name: "text",
    company_id: "uuid",
    company_name: "text",
    company_logo: "text",
    application_status: "text",
    applied_at: "timestamp",
  },
};

class SchemaValidator {
  constructor() {
    this.issues = [];
  }

  validateSelectQuery(file, line, table, selectFields) {
    const tableSchema = ACTUAL_SCHEMA[table];

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

    if (selectFields === "*") {
      return; // Wildcard select is usually safe
    }

    // Parse select fields
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

  parseSelectFields(selectFields) {
    return selectFields
      .replace(/\s+/g, " ")
      .replace(/\([^)]*\)/g, "") // Remove function calls
      .split(",")
      .map((f) => f.trim())
      .map((f) => f.split(":")[0]) // Remove aliases
      .map((f) => f.split("(")[0]) // Remove function calls
      .map((f) => f.split(" ")[0]) // Remove AS aliases
      .filter((f) => f && !f.includes("!"));
  }

  isValidField(field, table, tableSchema) {
    if (field === "*") return true;
    if (field.includes(".")) return true; // Joined fields
    if (field.startsWith("!")) return true; // Supabase syntax

    return field in tableSchema;
  }

  scanFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Look for .from("table") patterns
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

  checkKnownIssues(filePath, lineNumber, line) {
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

  scanProject(rootDir) {
    const scanDir = (dir) => {
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

  generateReport() {
    const errorCount = this.issues.filter((i) => i.severity === "error").length;
    const warningCount = this.issues.filter(
      (i) => i.severity === "warning"
    ).length;
    const infoCount = this.issues.filter((i) => i.severity === "info").length;

    let report = `# Database Schema Validation Report

Generated: ${new Date().toISOString()}

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

    // Add schema reference
    report += `## Database Schema Reference\n\n`;
    report += `### Jobs Table (Most Common Issues)\n\n`;

    const jobsSchema = ACTUAL_SCHEMA.jobs;
    report += `**Actual fields in jobs table:**\n`;
    for (const [field, type] of Object.entries(jobsSchema)) {
      report += `- ${field}: ${type}\n`;
    }

    report += `\n**Common mistakes:**\n`;
    report += `- ❌ \`responsibilities\` field does not exist\n`;
    report += `- ❌ \`hourly_rate\` field does not exist (use hourly_rate_min/max)\n`;
    report += `- ✅ \`requirements\` is an ARRAY type, not text\n`;
    report += `- ✅ Use \`experience_level\` instead of custom experience fields\n\n`;

    return report;
  }

  getIssues() {
    return this.issues;
  }
}

// Main execution
function main() {
  console.log("🔍 Starting database schema validation...");

  const projectRoot = process.argv[2] || process.cwd();
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

  // Write report to file
  const reportPath = path.join(projectRoot, "schema-validation-report.md");
  fs.writeFileSync(reportPath, report);

  console.log(`📝 Report written to: ${reportPath}`);

  // Show critical issues in console
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    console.log("\n❌ CRITICAL ERRORS FOUND:");
    errors.forEach((error) => {
      console.log(`   ${error.file}:${error.line} - ${error.issue}`);
    });
    console.error(
      `\n❌ Found ${errors.length} schema errors. Please fix them before proceeding.`
    );
    process.exit(1);
  } else {
    console.log("\n✅ No critical schema errors found!");

    const warnings = issues.filter((i) => i.severity === "warning");
    if (warnings.length > 0) {
      console.log(
        `\n⚠️  Found ${warnings.length} warnings. Consider reviewing them.`
      );
    }
  }
}

if (require.main === module) {
  main();
}
