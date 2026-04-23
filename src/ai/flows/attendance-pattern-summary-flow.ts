'use server';
/**
 * @fileOverview A Genkit flow for generating a summary of a driver's attendance patterns.
 *
 * - summarizeAttendancePattern - A function that generates an AI summary of a driver's attendance history.
 * - AttendancePatternSummaryInput - The input type for the summarizeAttendancePattern function.
 * - AttendancePatternSummaryOutput - The return type for the attendancePatternSummaryFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AttendancePatternSummaryInputSchema = z.object({
  driverName: z.string().describe("The name of the driver."),
  attendanceRecords: z.array(z.object({
    date: z.string().describe("The date of the attendance record in YYYY-MM-DD format."),
    status: z.enum(['present', 'absent', 'leave']).describe("The attendance status for the day."),
  })).describe("An array of recent attendance records for the driver."),
});
export type AttendancePatternSummaryInput = z.infer<typeof AttendancePatternSummaryInputSchema>;

const AttendancePatternSummaryOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the driver's attendance patterns, highlighting consistency or any recurring issues."),
});
export type AttendancePatternSummaryOutput = z.infer<typeof AttendancePatternSummaryOutputSchema>;

export async function summarizeAttendancePattern(input: AttendancePatternSummaryInput): Promise<AttendancePatternSummaryOutput> {
  return attendancePatternSummaryFlow(input);
}

const attendancePatternSummaryPrompt = ai.definePrompt({
  name: 'attendancePatternSummaryPrompt',
  input: {schema: AttendancePatternSummaryInputSchema},
  output: {schema: AttendancePatternSummaryOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing employee attendance patterns. Your task is to review the provided attendance records for a driver and generate a concise summary highlighting their consistency or any recurring issues.

Driver Name: {{{driverName}}}
Recent Attendance Records:
{{#each attendanceRecords}}
- Date: {{{date}}}, Status: {{{status}}}
{{/each}}

Based on these records, provide a summary of their attendance patterns. Focus on identifying consistency, punctuality, and any patterns of absence or leave. The summary should be concise and professional. Do not include a conversational opening or closing.`,
});

const attendancePatternSummaryFlow = ai.defineFlow(
  {
    name: 'attendancePatternSummaryFlow',
    inputSchema: AttendancePatternSummaryInputSchema,
    outputSchema: AttendancePatternSummaryOutputSchema,
  },
  async input => {
    const {output} = await attendancePatternSummaryPrompt(input);
    return output!;
  }
);
