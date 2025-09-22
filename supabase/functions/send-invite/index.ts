import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  displayName: string;
  role: 'admin' | 'leader' | 'musician' | 'member';
  ministryFunction?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request data
    const { email, displayName, role, ministryFunction }: InviteRequest = await req.json();

    // Get the current user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if current user is admin
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || currentUserProfile?.role !== 'admin') {
      throw new Error('Only admins can send invites');
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', email)
      .single();

    if (existingProfile) {
      throw new Error('User already exists');
    }

    // Generate invite token (you could store this in a separate invites table)
    const inviteToken = crypto.randomUUID();
    const inviteUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${inviteToken}&type=invite&redirect_to=${req.headers.get('origin')}/auth`;

    // For now, we'll create the user directly since we don't have email service set up
    // In a real app, you'd send an email with the invite link
    const tempPassword = crypto.randomUUID().slice(0, 12) + "A1!";
    
    const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role: role,
        ministry_function: ministryFunction,
        invited_by: user.id,
        temp_password: tempPassword
      }
    });

    if (signUpError) {
      throw signUpError;
    }

    // Update the profile with the correct role
    if (newUser.user) {
      await supabase
        .from('profiles')
        .update({ 
          role: role,
          ministry_function: ministryFunction 
        })
        .eq('user_id', newUser.user.id);

      await supabase
        .from('user_roles')
        .update({ role: role })
        .eq('user_id', newUser.user.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Usuário ${displayName} foi criado com sucesso. Email: ${email}, Senha temporária: ${tempPassword}`,
        tempPassword
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        success: false 
      }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);