import type { Curriculum, StudentLevel, AcademicYear, HoursPerSession } from './types'

export const AREAS: string[] = [
  'Adabor', 'Agargaon', 'Azimpur', 'Badda', 'Banani', 'Baridhara', 'Bashabo',
  'Bashundhara R/A', 'Dhanmondi', 'Elephant Road', 'DOHS Mirpur', 'DOHS Mohakhali',
  'East Raza Bazar', 'Farmgate', 'Gulshan 1', 'Gulshan 2', 'Hatirpool', 'Jigatola',
  'Kafrul', 'Kalabagan', 'Kathalbagan', 'Khilgaon', 'Khilkhet', 'Lalmatia', 'Lalbagh',
  'Malibagh', 'Matikata', 'Mirpur 1', 'Mirpur 2', 'Mirpur 10', 'Mirpur 11', 'Mirpur 12',
  'Mohakhali', 'Mohammadpur', 'Motijheel', 'Mugda', 'Narayanganj', 'Niketan', 'Nikunja',
  'Old Dhaka', 'Paltan', 'Panthapath', 'Rampura', 'Rayerbagh', 'Sadarghat', 'Shantinagar',
  'Shyamoli', 'Tejgaon', 'Uttara Sector 3', 'Uttara Sector 4', 'Uttara Sector 6',
  'Uttara Sector 7', 'Uttara Sector 10', 'Wari', 'West Raza Bazar',
]

export const UNIVERSITIES: string[] = [
  'BUET', 'DUET', 'University of Dhaka', 'Jahangirnagar University', 'Rajshahi University',
  'Chittagong University', 'Khulna University', 'Bangladesh Agricultural University',
  'SUST', 'Comilla University', 'Noakhali Science and Technology University',
  'Jessore University of Science and Technology', 'Mawlana Bhashani Science and Technology University',
  'Pabna University of Science and Technology', 'BUP', 'NSU', 'IUB', 'BRAC University',
  'AIUB', 'East West University', 'Southeast University', 'UIU',
  'Daffodil International University', 'Green University of Bangladesh',
  'Stamford University Bangladesh', 'Notre Dame College', 'Dhaka College',
  'Dhaka City College', 'Ideal College', 'Rajuk Uttara Model College',
]

export const DEPARTMENTS: string[] = [
  'Accounting', 'Agronomy', 'Arabic', 'Architecture', 'Bangla', 'Biochemistry',
  'Botany', 'Business Administration', 'Chemistry', 'Civil Engineering',
  'Computer Science & Engineering', 'Criminology', 'Economics', 'Education',
  'Electrical & Electronic Engineering', 'English', 'Environmental Science',
  'Finance', 'Food Science & Nutrition', 'Forestry', 'Geography & Environment',
  'Geology', 'History', 'International Relations', 'Islamic History & Culture',
  'Islamic Studies', 'Law', 'Management', 'Marine Science', 'Marketing',
  'Mathematics', 'Mechanical Engineering', 'Microbiology', 'Pharmacy',
  'Philosophy', 'Physics', 'Political Science', 'Psychology', 'Public Administration',
  'Sociology', 'Statistics', 'Textile Engineering', 'Tourism & Hospitality Management',
  'Urban & Regional Planning', 'Veterinary Science', 'Zoology',
]

export const SUBJECTS: string[] = [
  'Accounting', 'Bangla', 'Biology', 'Business Studies', 'Chemistry', 'Economics',
  'English', 'Finance', 'Geography', 'Higher Mathematics', 'History', 'ICT',
  'Islamic Studies', 'Mathematics', 'Physics', 'Political Science', 'Social Science',
  'Statistics',
]

export const CURRICULUMS: Curriculum[] = [
  'Bangla Medium',
  'English Version',
  'English Medium',
]

export const STUDENT_LEVELS: StudentLevel[] = [
  'Preschool',
  'Class 1–2',
  'Class 3–5',
  'Class 6–8',
  'Class 9–10',
  'SSC Candidate',
  'Class 11–12',
  'HSC Candidate',
  'Admission Candidate',
]

export const ACADEMIC_YEARS: AcademicYear[] = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Masters',
  'Graduate',
]

export const HOURS_OPTIONS: HoursPerSession[] = ['1', '1.5', '2', '2.5', '3+']
