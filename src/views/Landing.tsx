import './Landing.css';
import Button from './components/subviews/Button';

function Landing() {
    return (
      <div className="welcome flex flex-col align-left space-y-4">
        <span className="text-3xl text-left font-semibold">👋 Welcome</span>
        <span className="text-base font-light">
            Thanks for taking the time to look at my website! I’m Ethan Bovard, a software engineer with professional experience in the MERN
            stack (Mongo, Express, React, Node), GitLab CI/CD, and unit testing in Cypress, Mocha, and Chai.
        </span>
        <span className="text-base font-light">
          An eventual goal in my career is to work on things that are of large scale and that have the greatest positive impact that empowers
          any user.
        </span>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Button url="/Resume_Portfolio.pdf" text="View resume" color="bg-blue-600" />
          <Button url="https://linkedin.com/in/ethan-bovard" text="View LinkedIn profile" color="bg-blue-800" />
        </div>
      </div>
    );
  }
  
export default Landing;
