import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  apiKey: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AuthScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      apiKey: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    await login(values.username, values.password, values.apiKey);
  };

  return (
    <div className="fixed inset-0 bg-dark z-50 flex items-center justify-center">
      <div className="bg-dark-lighter p-8 rounded-lg shadow-lg w-96">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary mb-1">Nexus C2</h1>
          <p className="text-gray-400 text-sm">Command & Control Server</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-400">Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full bg-dark-lightest border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-400">Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      className="w-full bg-dark-lightest border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-400 flex items-center justify-between">
                    <span>API Key <span className="text-xs text-gray-500">(optional)</span></span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-400"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      <i className={`fas ${showApiKey ? 'fa-eye-slash' : 'fa-eye'} mr-1`}></i>
                      {showApiKey ? 'Hide' : 'Show'}
                    </Button>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type={showApiKey ? "text" : "password"}
                      placeholder="Enter API key for enhanced access"
                      className="w-full bg-dark-lightest border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Authenticate</span>
                  <i className="fas fa-arrow-right ml-2"></i>
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AuthScreen;
