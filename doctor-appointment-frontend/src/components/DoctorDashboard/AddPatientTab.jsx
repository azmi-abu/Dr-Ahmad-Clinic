import React from 'react';

const AddPatientTab = ({ newPatient, setNewPatient, handleAddPatient, addMessage }) => (
  <div className="mt-6 p-4 bg-white rounded-xl shadow animate-fade-in">
    <img
      src="/images/doctor-patient_hd.jpg"
      alt="Doctor and Patient"
      className="w-full h-[200px] md:h-[300px] object-cover rounded-lg mb-4 shadow"
    />

    <h2 className="text-xl font-semibold mb-4 text-center text-blue-800">הוספת מטופל חדש</h2>

    <form onSubmit={handleAddPatient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        type="text"
        value={newPatient.name}
        onChange={(e) => setNewPatient((p) => ({ ...p, name: e.target.value }))}
        placeholder="Full Name"
        className="px-4 py-2 border rounded"
        required
      />
      <input
        type="text"
        value={newPatient.phone}
        onChange={(e) => {
          const val = e.target.value;
          if (!/^[0-9]*$/.test(val)) return;
          if (val.length > 10) return;
          setNewPatient((p) => ({ ...p, phone: val }));
        }}
        placeholder="Phone (e.g. 0501234567)"
        className="px-4 py-2 border rounded"
        required
      />
      <button
        type="submit"
        className="col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition w-fit mx-auto"
      >
        Add Patient
      </button>
    </form>

    {addMessage && (
      <p className={`mt-4 text-sm text-center ${addMessage.startsWith('✅') ? 'text-green-700' : 'text-red-600 animate-shake'}`}>
        {addMessage}
      </p>
    )}
  </div>
);

export default AddPatientTab;
