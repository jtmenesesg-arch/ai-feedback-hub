import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // First, verify the caller is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    // Create a client with the user's JWT to verify their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authenticated user
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !caller) {
      console.error("Auth error:", authError);
      throw new Error("Invalid authentication");
    }

    console.log("Request from user:", caller.id);

    // Check if the caller has admin role using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseUser
      .rpc('has_role', { _user_id: caller.id, _role: 'admin' });

    if (roleError) {
      console.error("Role check error:", roleError);
      throw new Error("Failed to verify permissions");
    }

    if (!isAdmin) {
      console.error("Non-admin user attempted to create user:", caller.id);
      throw new Error("Unauthorized: Admin access required");
    }

    console.log("Admin verified, proceeding with user creation");

    const { email, password, nombre, rol } = await req.json();
    
    if (!email || !password || !nombre) {
      throw new Error("email, password, and nombre are required");
    }

    console.log("Creating user:", email);

    // Use service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create user with admin API
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre }
    });

    if (createError) {
      console.error("Error creating auth user:", createError);
      throw new Error(createError.message);
    }

    console.log("Auth user created:", authData.user.id);

    // Update role if admin
    if (rol === 'admin' && authData.user) {
      const { error: roleUpdateError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', authData.user.id);

      if (roleUpdateError) {
        console.error("Error updating role:", roleUpdateError);
      } else {
        console.log("Role updated to admin");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          nombre
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
