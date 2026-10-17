import React, {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabaseClient";
import "./index.css";
import StorePage from "./StorePage";
import ProductForm from "./ProductForm";
import PlansPage from "./PlansPage";

// Archivo completo con Planes integrado
