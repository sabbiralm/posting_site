'use client'

import React from 'react'

function page() {

  const [formData, setFormData] = React.useState({});

const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
  console.log(formData);

}



const handleSubmit = (e) => {
  e.preventDefault();
 console.log('from form submit', formData);

 

}



  return (
    <div>
      <h1>Hello, Next.js!</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Enter something..." 
        name ='username'
        value = {formData.username || ''}
        onChange={handleChange}
        />
        <input type="number" placeholder="Enter a number..." 
        name='age'
        value = {formData.age || ''}
        onChange={handleChange}
        />

        
        
        
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default page
