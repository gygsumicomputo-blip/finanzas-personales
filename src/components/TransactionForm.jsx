import { useState, useMemo, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORIAS_GASTO = ["comida", "transporte", "servicios", "entretenimiento", "otros"];
const CATEGORIAS_INGRESO = ["salario", "ventas", "otros"];
const COLORES = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

export default function TransactionForm() {
  const [uid, setUid] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tipo, setTipo] = useState("gasto");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [descripcion, setDescripcion] = useState("");

  const hoyInicial = new Date();
  const mesActual = `${hoyInicial.getFullYear()}-${String(hoyInicial.getMonth() + 1).padStart(2, "0")}`;
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);

  const categoriasDisponibles = tipo === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO;

  // --- AUTENTICACIÓN ANÓNIMA ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        signInAnonymously(auth);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- LEER SOLO LAS TRANSACCIONES DE ESTE uid Y ESTE MES ---
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "transacciones"),
      where("uid", "==", uid),
      where("mes", "==", mesSeleccionado),
      orderBy("fecha", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransacciones(datos);
      setCargando(false);
    });

    return () => unsubscribe();
  }, [uid, mesSeleccionado]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!monto || Number(monto) <= 0 || !uid) return;

    const ahora = new Date();
    const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;

    try {
      await addDoc(collection(db, "transacciones"), {
        uid,
        tipo,
        monto: Number(monto),
        categoria,
        descripcion,
        fecha: hoy,
        mes: hoy.slice(0, 7),
        creadoEn: serverTimestamp(),
      });
      setMonto("");
      setDescripcion("");
    } catch (error) {
      console.error("Error al guardar la transacción:", error);
      alert("No se pudo guardar. Revisa la consola para más detalles.");
    }
  }

  const resumen = useMemo(() => {
    const ingresos = transacciones.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.monto, 0);
    const gastos = transacciones.filter((t) => t.tipo === "gasto").reduce((s, t) => s + t.monto, 0);
    return { ingresos, gastos, saldo: ingresos - gastos };
  }, [transacciones]);

  const gastosPorCategoria = useMemo(() => {
    const grupos = {};
    transacciones
      .filter((t) => t.tipo === "gasto")
      .forEach((t) => { grupos[t.categoria] = (grupos[t.categoria] || 0) + t.monto; });
    return Object.entries(grupos).sort((a, b) => b[1] - a[1]);
  }, [transacciones]);

  const datosGrafica = gastosPorCategoria.map(([categoria, total]) => ({
    categoria,
    total,
  }));

  const formatoCOP = (n) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  if (cargando) {
    return <p className="text-center p-6 text-slate-500">Cargando transacciones...</p>;
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 font-sans">
      <h1 className="text-xl font-bold text-slate-800">Finanzas Personales</h1>

      <input
        type="month"
        value={mesSeleccionado}
        onChange={(e) => setMesSeleccionado(e.target.value)}
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-700">Ingresos</p>
          <p className="font-semibold text-green-800">{formatoCOP(resumen.ingresos)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs text-red-700">Gastos</p>
          <p className="font-semibold text-red-800">{formatoCOP(resumen.gastos)}</p>
        </div>
        <div className={`rounded-lg p-3 ${resumen.saldo >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
          <p className="text-xs text-slate-600">Saldo</p>
          <p className={`font-semibold ${resumen.saldo >= 0 ? "text-blue-800" : "text-orange-800"}`}>
            {formatoCOP(resumen.saldo)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => { setTipo("gasto"); setCategoria(CATEGORIAS_GASTO[0]); }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium ${tipo === "gasto" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            Gasto
          </button>
          <button type="button" onClick={() => { setTipo("ingreso"); setCategoria(CATEGORIAS_INGRESO[0]); }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium ${tipo === "ingreso" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            Ingreso
          </button>
        </div>

        <input type="number" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
          {categoriasDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <input type="text" placeholder="Descripción (ej. almuerzo con cliente)" value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />

        <button type="submit" className="w-full bg-slate-800 text-white rounded-md py-2 text-sm font-medium">
          Agregar
        </button>
      </form>

      {gastosPorCategoria.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">Gastos por categoría</p>
          <div className="space-y-1">
            {gastosPorCategoria.map(([cat, total]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span className="capitalize text-slate-600">{cat}</span>
                <span className="font-medium text-slate-800">{formatoCOP(total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {datosGrafica.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4" style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datosGrafica}
                dataKey="total"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => entry.categoria}
              >
                {datosGrafica.map((_, index) => (
                  <Cell key={index} fill={COLORES[index % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatoCOP(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-2">
        {transacciones.map((t) => (
          <div key={t.id} className="flex justify-between items-center bg-white border border-slate-200 rounded-md px-3 py-2 text-sm">
            <div>
              <p className="text-slate-700">{t.descripcion || t.categoria}</p>
              <p className="text-xs text-slate-400 capitalize">{t.categoria} · {t.fecha}</p>
            </div>
            <span className={t.tipo === "ingreso" ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
              {t.tipo === "ingreso" ? "+" : "-"}{formatoCOP(t.monto)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
