import React from 'react';
import PublicNavbar from '../components/layout/PublicNavbar';

const About: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <PublicNavbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-6">About CloudNest</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          CloudNest was created with a simple mission: to make cloud storage secure, intuitive, and accessible to everyone.
          We believe that managing files should be effortless and that privacy should never be compromised.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Built by a passionate team of developers and designers, CloudNest leverages cutting-edge technologies like React,
          Node.js, and MongoDB to deliver a seamless experience. Whether you're a freelancer, a student, or an enterprise,
          CloudNest adapts to your needs with role-based access control and flexible storage plans.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Our platform is hosted on a global infrastructure to ensure fast file delivery anywhere in the world. Security is
          our top priority—your data is protected with AES-256 encryption at rest and TLS in transit. We continuously
          monitor and improve our systems to keep your information safe.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Our Values</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li><strong>User-Centric Design:</strong> We put user experience at the forefront of everything we do.</li>
          <li><strong>Security & Privacy:</strong> Your files are yours alone—protected and private.</li>
          <li><strong>Transparency:</strong> We are open about our practices and welcome feedback from our community.</li>
          <li><strong>Innovation:</strong> We embrace modern technologies to deliver cutting-edge features.</li>
        </ul>
      </main>
      <footer className="bg-gray-100 dark:bg-gray-800 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} CloudNest. All rights reserved.
      </footer>
    </div>
  );
};

export default About;
