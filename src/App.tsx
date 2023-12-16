import './App.css';
import { useState, useEffect } from 'react';
import Landing from './views/Landing';
import Navigation from './views/Navigation';
import CardView from './views/components/views/CardView';

function App() {
  var [mappedData, setMappedData] = useState([]);
  useEffect(() => {
    fetch("/data.json").then((response) => {
      return response.json();
    }).then((json) => {
      setMappedData(json["sections"].map((section: any, index: number) => <CardView key={index} title={section.title} components={section.components} />));
    });
  }, []);
  return (
    <>
      <Navigation />
      <div className="App py-16">
        <div className="space-y-16 lg:px-64 px-8">
          <Landing />
          {mappedData}
        </div>
      </div>
    </>
  );
}

export default App;
