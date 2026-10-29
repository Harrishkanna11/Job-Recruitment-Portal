// Initial seed data for HireHub
import bcrypt from 'bcryptjs';

export const getSeedData = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);
  const adminPasswordHash = await bcrypt.hash('Admin123!', salt);

  const users = [
    // Admin
    { id: 1, email: 'admin@hirehub.com', password_hash: adminPasswordHash, role: 'admin', account_status: 'active' },
    
    // Recruiters
    { id: 2, email: 'sarah.recruiter@technova.com', password_hash: passwordHash, role: 'recruiter', account_status: 'active' },
    { id: 3, email: 'marcus.hr@cloudscale.io', password_hash: passwordHash, role: 'recruiter', account_status: 'active' },
    { id: 4, email: 'elena.talent@apexdigital.com', password_hash: passwordHash, role: 'recruiter', account_status: 'active' },

    // Job Seekers
    { id: 5, email: 'alex.johnson@example.com', password_hash: passwordHash, role: 'job_seeker', account_status: 'active' },
    { id: 6, email: 'samantha.lee@example.com', password_hash: passwordHash, role: 'job_seeker', account_status: 'active' },
    { id: 7, email: 'david.miller@example.com', password_hash: passwordHash, role: 'job_seeker', account_status: 'active' },
    { id: 8, email: 'emily.zhang@example.com', password_hash: passwordHash, role: 'job_seeker', account_status: 'active' },
  ];

  const companies = [
    {
      id: 1,
      name: 'TechNova Solutions',
      description: 'TechNova is a global leader in AI-driven cloud automation and enterprise SaaS architectures.',
      industry: 'Software & Technology',
      website: 'https://technova.example.com',
      logo_url: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150&auto=format&fit=crop&q=80',
      location: 'San Francisco, CA',
      size: '500-1000 employees',
      is_verified: true,
    },
    {
      id: 2,
      name: 'CloudScale Systems',
      description: 'Pioneering ultra-low latency infrastructure and scalable Kubernetes distributed systems for financial institutions.',
      industry: 'Cloud Infrastructure & DevOps',
      website: 'https://cloudscale.example.com',
      logo_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&auto=format&fit=crop&q=80',
      location: 'New York, NY',
      size: '200-500 employees',
      is_verified: true,
    },
    {
      id: 3,
      name: 'Apex Digital Studio',
      description: 'Award-winning digital experience agency crafting memorable product identities, design systems, and mobile applications.',
      industry: 'Product Design & Creative',
      website: 'https://apexdigital.example.com',
      logo_url: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80',
      location: 'Austin, TX',
      size: '50-100 employees',
      is_verified: true,
    },
  ];

  const recruiter_profiles = [
    {
      id: 1,
      user_id: 2,
      company_id: 1,
      full_name: 'Sarah Jenkins',
      phone: '+1 (415) 890-1234',
      title: 'Head of Technical Talent Acquisition',
    },
    {
      id: 2,
      user_id: 3,
      company_id: 2,
      full_name: 'Marcus Vance',
      phone: '+1 (212) 555-9876',
      title: 'Principal Technical Recruiter',
    },
    {
      id: 3,
      user_id: 4,
      company_id: 3,
      full_name: 'Elena Rostova',
      phone: '+1 (512) 440-2311',
      title: 'Design People Lead',
    },
  ];

  const job_seeker_profiles = [
    {
      id: 1,
      user_id: 5,
      full_name: 'Alex Johnson',
      headline: 'Senior Full-Stack Engineer | React, Node.js & Cloud Architecture',
      phone: '+1 (650) 432-8765',
      location: 'San Francisco, CA (Open to Remote)',
      bio: 'Versatile Full-Stack Engineer with 6+ years of experience engineering high-throughput SaaS web applications and RESTful microservices.',
      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'GraphQL', 'Tailwind CSS']),
      experience: JSON.stringify([
        { title: 'Senior Software Engineer', company: 'Nexus Labs', duration: '2022 - Present', description: 'Architected scalable microservices handling 10M+ daily events.' },
        { title: 'Full-Stack Developer', company: 'InnoTech Solutions', duration: '2019 - 2022', description: 'Built client-facing web portals with React and Node.js.' }
      ]),
      education: JSON.stringify([
        { degree: 'B.S. in Computer Science', institution: 'University of California, Berkeley', year: '2019' }
      ]),
      portfolio_url: 'https://alexjohnson.dev',
      github_url: 'https://github.com/alexjohnson-dev',
      linkedin_url: 'https://linkedin.com/in/alexjohnson',
      resume_path: 'resumes/demo_alex_johnson_resume.pdf',
      resume_original_name: 'Alex_Johnson_Resume_2026.pdf',
    },
    {
      id: 2,
      user_id: 6,
      full_name: 'Samantha Lee',
      headline: 'Lead Data Scientist & Machine Learning Engineer',
      phone: '+1 (408) 789-2345',
      location: 'Seattle, WA',
      bio: 'Specialist in natural language processing, predictive modeling, PyTorch, and deploying real-time LLM inference pipelines.',
      skills: JSON.stringify(['Python', 'PyTorch', 'TensorFlow', 'PostgreSQL', 'FastAPI', 'Pandas', 'AWS SageMaker']),
      experience: JSON.stringify([
        { title: 'Staff Data Scientist', company: 'Cognitive Dynamics', duration: '2021 - Present', description: 'Trained and optimized transformer models cutting inference latency by 45%.' }
      ]),
      education: JSON.stringify([
        { degree: 'M.S. in Artificial Intelligence', institution: 'Stanford University', year: '2021' }
      ]),
      portfolio_url: 'https://samanthalee.ai',
      github_url: 'https://github.com/samanthalee-ai',
      linkedin_url: 'https://linkedin.com/in/samanthalee-ai',
      resume_path: 'resumes/demo_samantha_lee_resume.pdf',
      resume_original_name: 'Samantha_Lee_CV.pdf',
    },
    {
      id: 3,
      user_id: 7,
      full_name: 'David Miller',
      headline: 'Senior Product Designer | UI/UX & Design Systems',
      phone: '+1 (512) 334-9988',
      location: 'Austin, TX',
      bio: 'Design practitioner devoted to user empathy, accessible component libraries, interactive prototypes, and conversion optimization.',
      skills: JSON.stringify(['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Prototyping', 'Tailwind CSS']),
      experience: JSON.stringify([
        { title: 'Lead Product Designer', company: 'Studio Craft', duration: '2020 - Present', description: 'Redesigned core mobile onboarding increasing activation by 32%.' }
      ]),
      education: JSON.stringify([
        { degree: 'B.F.A. in Interaction Design', institution: 'Rhode Island School of Design', year: '2020' }
      ]),
      portfolio_url: 'https://davidmiller.design',
      github_url: '',
      linkedin_url: 'https://linkedin.com/in/davidmiller-design',
      resume_path: '',
      resume_original_name: '',
    },
    {
      id: 4,
      user_id: 8,
      full_name: 'Emily Zhang',
      headline: 'Junior Frontend Developer | JavaScript, React & Modern CSS',
      phone: '+1 (312) 777-6543',
      location: 'Chicago, IL',
      bio: 'Recent CS graduate excited about creating accessible, responsive web interfaces with React and Tailwind CSS.',
      skills: JSON.stringify(['JavaScript', 'React', 'HTML5', 'CSS3', 'Tailwind CSS', 'Git']),
      experience: JSON.stringify([
        { title: 'Frontend Intern', company: 'WebCraft Media', duration: 'Summer 2025', description: 'Developed reusable React components for customer dashboard.' }
      ]),
      education: JSON.stringify([
        { degree: 'B.S. in Computer Science', institution: 'University of Illinois at Urbana-Champaign', year: '2025' }
      ]),
      portfolio_url: 'https://emilyzhang.me',
      github_url: 'https://github.com/emilyzhang',
      linkedin_url: 'https://linkedin.com/in/emilyzhang',
      resume_path: '',
      resume_original_name: '',
    },
  ];

  const jobs = [
    {
      id: 1,
      recruiter_id: 2,
      company_id: 1,
      title: 'Senior Full-Stack Engineer',
      description: 'We are seeking an experienced Senior Full-Stack Engineer to lead the design and deployment of our high-volume analytics platform. You will collaborate closely with product managers and architects to deliver responsive web applications and reliable microservice APIs.',
      requirements: '• 5+ years building production web applications\n• Strong command of React, Node.js, and TypeScript\n• Solid SQL database schema design and optimization experience (PostgreSQL preferred)\n• Experience working with cloud platforms (AWS, GCP, or Azure)\n• Excellent communication and collaborative problem-solving skills',
      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker']),
      salary_min: 140000,
      salary_max: 180000,
      salary_currency: 'USD',
      location: 'San Francisco, CA',
      job_type: 'full-time',
      experience_level: 'senior',
      is_remote: true,
      category: 'Software Development',
      status: 'published',
      views_count: 142,
      deadline: '2026-12-31T23:59:59Z',
    },
    {
      id: 2,
      recruiter_id: 2,
      company_id: 1,
      title: 'Lead AI / Machine Learning Scientist',
      description: 'Join TechNova’s AI research unit to formulate and implement cutting-edge foundation models for enterprise automation. You will oversee dataset pipelines, fine-tune models, and deploy scalable inference engines.',
      requirements: '• Master’s or Ph.D. in Computer Science, AI, or related field\n• 4+ years practical deep learning modeling experience (PyTorch / TensorFlow)\n• Proven expertise in LLM fine-tuning, RAG pipelines, or computer vision\n• Experience deploying containerized models with FastAPI / Triton',
      skills: JSON.stringify(['Python', 'PyTorch', 'Machine Learning', 'FastAPI', 'AWS']),
      salary_min: 175000,
      salary_max: 230000,
      salary_currency: 'USD',
      location: 'San Francisco, CA',
      job_type: 'full-time',
      experience_level: 'lead',
      is_remote: true,
      category: 'AI/ML',
      status: 'published',
      views_count: 98,
      deadline: '2026-11-30T23:59:59Z',
    },
    {
      id: 3,
      recruiter_id: 3,
      company_id: 2,
      title: 'DevOps & Cloud Infrastructure Specialist',
      description: 'CloudScale is searching for a dedicated DevOps Engineer to manage our high-resilience Kubernetes clusters and multi-region infrastructure. You will champion infrastructure-as-code and automated CI/CD pipelines.',
      requirements: '• 3+ years managing production Kubernetes and Terraform environments\n• Deep understanding of Linux networking, security, and VPC topologies\n• Experience with monitoring stacks (Prometheus, Grafana, Datadog)\n• Automation scripting with Python or Bash',
      skills: JSON.stringify(['Kubernetes', 'Terraform', 'AWS', 'Docker', 'Linux', 'CI/CD']),
      salary_min: 130000,
      salary_max: 165000,
      salary_currency: 'USD',
      location: 'New York, NY',
      job_type: 'full-time',
      experience_level: 'mid',
      is_remote: false,
      category: 'Software Development',
      status: 'published',
      views_count: 87,
      deadline: '2026-12-15T23:59:59Z',
    },
    {
      id: 4,
      recruiter_id: 4,
      company_id: 3,
      title: 'Senior Product Designer (UI/UX)',
      description: 'Apex Digital Studio is looking for a vision-oriented Senior Product Designer. You will create holistic digital experiences, conduct user research, craft scalable design systems, and deliver pixel-perfect Figma prototypes.',
      requirements: '• 4+ years creating web and mobile product interfaces\n• Mastery of Figma, auto-layout, and reusable component libraries\n• Experience conducting user testing, wireframing, and interactive prototyping\n• Working knowledge of frontend constraints (HTML/CSS) is a plus',
      skills: JSON.stringify(['Figma', 'UI/UX', 'Design Systems', 'User Research', 'Wireframing']),
      salary_min: 120000,
      salary_max: 155000,
      salary_currency: 'USD',
      location: 'Austin, TX',
      job_type: 'full-time',
      experience_level: 'senior',
      is_remote: true,
      category: 'Design',
      status: 'published',
      views_count: 110,
      deadline: '2026-11-20T23:59:59Z',
    },
    {
      id: 5,
      recruiter_id: 2,
      company_id: 1,
      title: 'Junior Frontend Developer',
      description: 'An exceptional growth opportunity for an aspiring frontend engineer! You will assist our core product team in building clean, accessible, and fast web interfaces using modern React and Tailwind CSS.',
      requirements: '• Proficiency with JavaScript (ES6+), HTML5, and CSS3\n• Hands-on project experience with React\n• Familiarity with Git version control\n• Enthusiastic about learning modern web development patterns',
      skills: JSON.stringify(['JavaScript', 'React', 'Tailwind CSS', 'Git', 'HTML5']),
      salary_min: 75000,
      salary_max: 95000,
      salary_currency: 'USD',
      location: 'Remote',
      job_type: 'full-time',
      experience_level: 'entry',
      is_remote: true,
      category: 'Software Development',
      status: 'published',
      views_count: 220,
      deadline: '2026-12-30T23:59:59Z',
    },
    {
      id: 6,
      recruiter_id: 3,
      company_id: 2,
      title: 'Growth Marketing Manager',
      description: 'Lead B2B acquisition and performance campaigns across paid search, digital channels, and content marketing. Analyze funnel analytics to drive sustained qualified inbound pipeline.',
      requirements: '• 3+ years in B2B SaaS growth marketing\n• Demonstrated track record in Google Ads, LinkedIn Ads, and SEO\n• Data-driven mentality with expertise in Google Analytics and HubSpot\n• Strong copywriting and positioning skills',
      skills: JSON.stringify(['Growth Marketing', 'SEO', 'SEM', 'Analytics', 'Content Strategy']),
      salary_min: 95000,
      salary_max: 130000,
      salary_currency: 'USD',
      location: 'New York, NY',
      job_type: 'full-time',
      experience_level: 'mid',
      is_remote: true,
      category: 'Marketing',
      status: 'published',
      views_count: 65,
      deadline: '2026-12-10T23:59:59Z',
    },
    {
      id: 7,
      recruiter_id: 4,
      company_id: 3,
      title: 'HR & Talent Operations Specialist',
      description: 'Help coordinate recruitment lifecycles, candidate experience, onboarding workflows, and company culture initiatives for our distributed team.',
      requirements: '• 2+ years experience in HR or recruitment coordination\n• Outstanding interpersonal and organizational skills\n• Experience with modern ATS tools and HRIS systems\n• Passion for building inclusive, high-performance workplace cultures',
      skills: JSON.stringify(['Recruiting', 'HR Operations', 'Onboarding', 'Candidate Experience']),
      salary_min: 70000,
      salary_max: 90000,
      salary_currency: 'USD',
      location: 'Austin, TX',
      job_type: 'full-time',
      experience_level: 'entry',
      is_remote: false,
      category: 'Human Resources',
      status: 'published',
      views_count: 54,
      deadline: '2026-11-28T23:59:59Z',
    },
    {
      id: 8,
      recruiter_id: 3,
      company_id: 2,
      title: 'Financial Analyst - FP&A',
      description: 'Support senior leadership with budget modeling, quarterly revenue forecasts, SaaS unit economics metrics (LTV, CAC, ARR), and investor reporting.',
      requirements: '• Bachelor’s degree in Finance, Accounting, or Economics\n• 3+ years experience in financial planning & analysis (SaaS experience preferred)\n• Advanced Excel and financial modeling capabilities\n• Experience with SQL or BI tools (Tableau, PowerBI)',
      skills: JSON.stringify(['Financial Modeling', 'SaaS Metrics', 'Excel', 'Forecasting', 'SQL']),
      salary_min: 105000,
      salary_max: 135000,
      salary_currency: 'USD',
      location: 'New York, NY',
      job_type: 'full-time',
      experience_level: 'mid',
      is_remote: true,
      category: 'Finance',
      status: 'published',
      views_count: 48,
      deadline: '2026-12-20T23:59:59Z',
    },
  ];

  const applications = [
    {
      id: 1,
      job_id: 1,
      seeker_id: 5, // Alex applied to Senior Full-Stack Engineer at TechNova
      resume_path: 'resumes/demo_alex_johnson_resume.pdf',
      cover_letter: 'I have spent the past 6 years building high-scale React and Node.js microservices. I am passionate about TechNova’s cloud analytics mission and am eager to bring my architectural experience to your team.',
      status: 'interview_scheduled',
      created_at: '2026-10-20T10:00:00Z',
    },
    {
      id: 2,
      job_id: 2,
      seeker_id: 6, // Samantha applied to Lead AI Scientist at TechNova
      resume_path: 'resumes/demo_samantha_lee_resume.pdf',
      cover_letter: 'Having led foundation model research and transformer optimization at Cognitive Dynamics, I would love to accelerate TechNova’s machine learning platform.',
      status: 'shortlisted',
      created_at: '2026-10-22T14:30:00Z',
    },
    {
      id: 3,
      job_id: 4,
      seeker_id: 7, // David applied to Senior Product Designer at Apex Digital
      resume_path: '',
      cover_letter: 'Apex Digital has long been an inspiration for design systems. I would relish the opportunity to lead product design and research for your premier client engagements.',
      status: 'under_review',
      created_at: '2026-10-24T11:15:00Z',
    },
    {
      id: 4,
      job_id: 5,
      seeker_id: 8, // Emily applied to Junior Frontend Developer at TechNova
      resume_path: '',
      cover_letter: 'As a passionate computer science graduate with several React projects, I am eager to contribute fresh energy and modern UI development skills to TechNova.',
      status: 'applied',
      created_at: '2026-10-26T09:45:00Z',
    },
  ];

  const interviews = [
    {
      id: 1,
      application_id: 1,
      recruiter_id: 2,
      seeker_id: 5,
      scheduled_at: '2026-11-05T15:00:00Z',
      duration_minutes: 45,
      meeting_type: 'video',
      meeting_link: 'https://meet.google.com/hirehub-alex-technova',
      notes: 'Technical architecture deep dive and system design discussion with Sarah Jenkins and Engineering VP.',
      status: 'scheduled',
    },
  ];

  const saved_jobs = [
    { id: 1, seeker_id: 5, job_id: 3, created_at: '2026-10-21T08:00:00Z' },
    { id: 2, seeker_id: 5, job_id: 2, created_at: '2026-10-23T12:00:00Z' },
    { id: 3, seeker_id: 6, job_id: 1, created_at: '2026-10-24T14:00:00Z' },
  ];

  const notifications = [
    {
      id: 1,
      user_id: 5,
      title: 'Interview Scheduled!',
      message: 'TechNova Solutions scheduled a video interview for "Senior Full-Stack Engineer" on Nov 5, 2026 at 3:00 PM UTC.',
      link: '/applications/my',
      is_read: false,
      created_at: '2026-10-25T16:00:00Z',
    },
    {
      id: 2,
      user_id: 6,
      title: 'Application Shortlisted',
      message: 'Congratulations! Your application for "Lead AI / Machine Learning Scientist" at TechNova has been shortlisted.',
      link: '/applications/my',
      is_read: false,
      created_at: '2026-10-24T18:00:00Z',
    },
    {
      id: 3,
      user_id: 2,
      title: 'New Applicant Received',
      message: 'Alex Johnson submitted an application for "Senior Full-Stack Engineer".',
      link: '/recruiter/applicants',
      is_read: true,
      created_at: '2026-10-20T10:05:00Z',
    },
  ];

  const reports = [
    {
      id: 1,
      reporter_id: 7,
      job_id: 8,
      reason: 'Inaccurate salary classification inquiry',
      details: 'Job title description is slightly ambiguous compared to senior level requirements.',
      status: 'pending',
      created_at: '2026-10-27T10:00:00Z',
    },
  ];

  const audit_logs = [
    {
      id: 1,
      admin_id: 1,
      action: 'SYSTEM_INITIALIZATION',
      target_type: 'SYSTEM',
      target_id: 1,
      details: 'HireHub platform initialized with standard verified enterprise employers and safety policies.',
      ip_address: '127.0.0.1',
      created_at: '2026-10-20T00:00:00Z',
    },
    {
      id: 2,
      admin_id: 1,
      action: 'VERIFY_COMPANY',
      target_type: 'COMPANY',
      target_id: 1,
      details: 'Verified employer profile for TechNova Solutions after business documentation check.',
      ip_address: '127.0.0.1',
      created_at: '2026-10-20T01:00:00Z',
    },
  ];

  return {
    users,
    companies,
    recruiter_profiles,
    job_seeker_profiles,
    jobs,
    applications,
    interviews,
    saved_jobs,
    notifications,
    reports,
    audit_logs,
  };
};
