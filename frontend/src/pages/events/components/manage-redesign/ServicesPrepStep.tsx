import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MessageSquare, Plus, CheckCircle2, Circle, ChevronDown, ChevronUp, User, Users, ClipboardList, Send } from 'lucide-react';
import { EventDetail } from '@/types/events';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { VENDOR_CATEGORIES, getCategoryLabel } from '@/constants/categories';
import { useCreateEventNeed, useEventNeeds, useReviewNeedApplication, useUpdateEventNeed } from '@/features/needs/hooks';
import { EventNeed, NeedApplication } from '@/types/needs';
import { NeedAgreements } from './NeedAgreements';

interface ServicesPrepStepProps {
    event: EventDetail;
    readonly?: boolean;
}

export function ServicesPrepStep({ event, readonly }: ServicesPrepStepProps) {
    const { data: needsResponse, isLoading } = useEventNeeds(event.id);
    const needs = needsResponse?.data || [];
    const createNeedMutation = useCreateEventNeed();
    const reviewApplicationMutation = useReviewNeedApplication();
    const updateNeedMutation = useUpdateEventNeed();

    const [isCreating, setIsCreating] = useState(false);
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [expandedNeedId, setExpandedNeedId] = useState<number | null>(null);

    // Feature checklist state (manual)
    const [checkedFeatures, setCheckedFeatures] = useState<Set<string>>(new Set());

    const handleCreateNeed = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createNeedMutation.mutateAsync({
                eventId: event.id,
                payload: {
                    title: title || 'Service Required',
                    category,
                    budget_min: budgetMin || null,
                    budget_max: budgetMax || null,
                    description: '', // Removed from redesign form
                    criticality: 'replaceable',
                },
            });
            toast.success('Need added to checklist!');
            setIsCreating(false);
            setCategory('');
            setTitle('');
            setBudgetMin('');
            setBudgetMax('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to add need');
        }
    };

    const handleReview = async (applicationId: number, status: 'accepted' | 'rejected') => {
        try {
            await reviewApplicationMutation.mutateAsync({ applicationId, status });
            toast.success(`Application ${status}!`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to review application');
        }
    };

    const toggleFeature = (name: string) => {
        const newSet = new Set(checkedFeatures);
        if (newSet.has(name)) newSet.delete(name);
        else newSet.add(name);
        setCheckedFeatures(newSet);
    };

    const handleHostOverride = async (needId: number) => {
        try {
            await updateNeedMutation.mutateAsync({
                needId,
                payload: { status: 'override_filled' },
            });
            toast.success('Need marked as filled via host override');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to override status');
        }
    };

    const handleUndoOverride = async (needId: number) => {
        try {
            await updateNeedMutation.mutateAsync({
                needId,
                payload: { status: 'open' },
            });
            toast.success('Override removed');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to undo override');
        }
    };

    const isFilled = (status: string) => status === 'filled' || status === 'override_filled';
    const filledNeedsCount = needs.filter(n => isFilled(n.status)).length;
    const progressPercentage = needs.length > 0 ? Math.round((filledNeedsCount / needs.length) * 100) : 0;

    return (
        <div className="space-y-8">
            {/* Main Preparation Checklist */}
            <div className="bg-white border-2 border-gray-800 p-8 shadow-[4px_4px_0px_#333] relative">
                <div className="absolute -top-4 left-10 px-4 py-1 bg-blue-400 text-white font-bold border-2 border-gray-800 -rotate-1 shadow-[2px_2px_0px_#333]">
                    SERVICES PREP CHECKLIST
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-4">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                            <ClipboardList className="h-6 w-6" /> Setup & Servicing
                        </h3>
                        <p className="text-sm text-gray-500 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}>
                            {progressPercentage}% of vendor services filled
                        </p>
                    </div>

                    {!readonly && (
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="bg-yellow-300 text-gray-900 border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] font-bold"
                            style={{ fontFamily: '"Permanent Marker", cursive' }}
                        >
                            <Plus className="h-4 w-4 mr-1" /> ADD NEW NEED
                        </Button>
                    )}
                </div>

                {/* Progress Bar (Scrapbook style) */}
                <div className="h-6 w-full bg-gray-100 border-2 border-gray-800 mb-8 relative overflow-hidden">
                    <div
                        className="h-full bg-green-400 transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-800 uppercase">
                        {filledNeedsCount} / {needs.length} Services Filled
                    </span>
                </div>

                {/* Add Need Form */}
                {isCreating && (
                    <div className="mb-8 p-6 bg-yellow-50/50 border-2 border-dashed border-gray-400 rounded-lg relative rotate-1">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-lg" style={{ fontFamily: '"Permanent Marker", cursive' }}>Add Vendor Need</h4>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleCreateNeed} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category (First)</label>
                                    <select
                                        required
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full border-2 border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-800 transition-all"
                                    >
                                        <option value="">Select a category</option>
                                        {VENDOR_CATEGORIES.map((group) => (
                                            <optgroup key={group.group} label={group.group}>
                                                {group.items.map((item) => (
                                                    <option key={item.id} value={item.id}>{item.label}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Optional Title</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Late Night DJ"
                                        className="w-full border-2 border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-800 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Budget Range (Optional)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min $"
                                            value={budgetMin}
                                            onChange={(e) => setBudgetMin(e.target.value)}
                                            className="w-full border-2 border-gray-300 bg-white px-2 py-1.5 text-xs focus:border-gray-800 transition-all"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max $"
                                            value={budgetMax}
                                            onChange={(e) => setBudgetMax(e.target.value)}
                                            className="w-full border-2 border-gray-300 bg-white px-2 py-1.5 text-xs focus:border-gray-800 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={createNeedMutation.isPending}
                                    className="bg-blue-400 text-white border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333]"
                                >
                                    {createNeedMutation.isPending ? 'Adding...' : 'Add to List'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Checklist Categories */}
                <div className="space-y-10">
                    {/* Section 1: Vendor Services */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b-2 border-gray-100 pb-2">
                            <span className="text-blue-500 font-bold">1/</span>
                            <h4 className="font-bold text-gray-700" style={{ fontFamily: '"Permanent Marker", cursive' }}>Vendor Services</h4>
                        </div>
                        {needs.length === 0 ? (
                            <p className="text-sm text-gray-400 italic py-4 text-center">No service needs defined yet.</p>
                        ) : (
                            needs.map((need) => (
                                <div key={need.id} className="group border-2 border-gray-50 hover:border-gray-200 rounded-xl p-4 transition-all bg-white shadow-sm hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 h-6 w-6 border-2 rounded transition-colors flex items-center justify-center ${isFilled(need.status) ? 'bg-green-400 border-gray-800' : 'bg-gray-100 border-gray-300'}`}>
                                            {isFilled(need.status) && <CheckCircle2 className="h-4 w-4 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div
                                                    className="cursor-pointer"
                                                    onClick={() => setExpandedNeedId(expandedNeedId === need.id ? null : need.id)}
                                                >
                                                    <h5 className={`font-bold text-lg leading-snug flex items-center gap-2 ${isFilled(need.status) ? 'text-gray-400 line-through decoration-gray-400' : 'text-gray-900'}`} style={{ fontFamily: '"Caveat", cursive', fontSize: '1.6rem' }}>
                                                        {need.title}
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 no-underline decoration-transparent">
                                                            {getCategoryLabel(need.category)}
                                                        </span>
                                                    </h5>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Status: {need.status.replace('_', ' ').toUpperCase()} • {need.application_count} applications
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {need.status === 'open' && (
                                                            <>
                                                                <Link
                                                                    to={`/vendors?eventId=${event.id}&needId=${need.id}&category=${encodeURIComponent(
                                                                        need.category,
                                                                    )}&needTitle=${encodeURIComponent(need.title)}`}
                                                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 border-2 border-gray-800 bg-white text-gray-900 shadow-[1px_1px_0px_#333] hover:bg-gray-100 hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none transition-all whitespace-nowrap"
                                                                    style={{
                                                                        fontFamily: '"Permanent Marker", cursive',
                                                                    }}
                                                                >
                                                                    <Send className="h-2.5 w-2.5" /> INVITE VENDORS
                                                                </Link>
                                                                {!readonly && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleHostOverride(need.id);
                                                                        }}
                                                                        className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 border-2 border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-800 hover:bg-yellow-100 hover:text-gray-900 transition-all whitespace-nowrap"
                                                                        style={{
                                                                            fontFamily: '"Permanent Marker", cursive',
                                                                        }}
                                                                    >
                                                                        <CheckCircle2 className="h-2.5 w-2.5" /> HOST OVERRIDE: MARK FILLED
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        {need.status === 'override_filled' && !readonly && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUndoOverride(need.id);
                                                                }}
                                                                className="text-[10px] font-bold text-gray-400 hover:text-red-500 underline"
                                                            >
                                                                Undo Override
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setExpandedNeedId(expandedNeedId === need.id ? null : need.id)}
                                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    {expandedNeedId === need.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </button>
                                            </div>

                                            {expandedNeedId === need.id && (
                                                <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-100 animate-in fade-in slide-in-from-top-2">
                                                    {(need.status === 'filled' || need.status === 'override_filled') ? (
                                                        <div className="space-y-4">
                                                            <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${need.status === 'override_filled' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${need.status === 'override_filled' ? 'bg-yellow-200' : 'bg-green-200'}`}>
                                                                    {need.status === 'override_filled' ? <Briefcase className="h-6 w-6 text-yellow-700" /> : <User className="h-6 w-6 text-green-700" />}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-xs font-bold uppercase tracking-wider ${need.status === 'override_filled' ? 'text-yellow-800' : 'text-green-800'}`}>
                                                                        {need.status === 'override_filled' ? 'Host Provided' : 'Assigned Vendor'}
                                                                    </p>
                                                                    <p className={`font-bold ${need.status === 'override_filled' ? 'text-yellow-700' : 'text-green-700 underline cursor-pointer hover:text-green-900'}`}>
                                                                        {need.status === 'override_filled' ? 'You marked this as filled manually' : (need.applications.find(a => a.status === 'accepted')?.vendor_name || 'Vendor Details')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {(need.applications.some(a => a.status === 'accepted') || need.applications.length > 0) && (
                                                                <NeedAgreements
                                                                    need={need}
                                                                    application={need.applications.find(a => a.status === 'accepted') || need.applications[0]}
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-bold text-gray-500 uppercase">Vendor Applications</span>
                                                                <span className="text-[10px] text-gray-400 italic px-2 py-1 bg-gray-50 rounded border">Agreement signed-on pending...</span>
                                                            </div>
                                                            {need.applications.length === 0 ? (
                                                                <div className="text-center py-6 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                                                                    <p className="text-xs text-gray-400 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}>No applications yet. Invite some vendors!</p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {need.applications.map((app) => (
                                                                        <div key={app.id} className="p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm flex items-center justify-between gap-4">
                                                                            <div className="min-w-0">
                                                                                <p className="font-bold text-gray-900 truncate" style={{ fontFamily: '"Permanent Marker", cursive' }}>{app.vendor_name}</p>
                                                                                <p className="text-[10px] text-green-600 font-bold">${app.proposed_price || '0'}</p>
                                                                            </div>
                                                                            {app.status === 'pending' && (
                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        className="bg-green-400 text-gray-900 border-2 border-gray-800 shadow-[1px_1px_0px_#333] h-7 px-3 text-[10px] font-bold"
                                                                                        onClick={() => handleReview(app.id, 'accepted')}
                                                                                    >
                                                                                        APPROVE
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        className="h-7 px-3 text-[10px] font-bold text-red-500 hover:bg-red-50"
                                                                                        onClick={() => handleReview(app.id, 'rejected')}
                                                                                    >
                                                                                        REJECT
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {need.applications.some(a => a.status === 'accepted') && (
                                                                <NeedAgreements
                                                                    need={need}
                                                                    application={need.applications.find(a => a.status === 'accepted')!}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Section 2: Other Event Features */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b-2 border-gray-100 pb-2">
                            <span className="text-purple-500 font-bold">2/</span>
                            <h4 className="font-bold text-gray-700" style={{ fontFamily: '"Permanent Marker", cursive' }}>Other Features Checklist</h4>
                        </div>
                        <p className="text-xs text-gray-500 italic mb-4" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}>
                            Manually check off other event features as they are prepared.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(event.features || []).map((feature) => (
                                <div
                                    key={feature.name}
                                    onClick={() => toggleFeature(feature.name)}
                                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${checkedFeatures.has(feature.name) ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                >
                                    <div className={`h-5 w-5 border-2 rounded flex items-center justify-center transition-all ${checkedFeatures.has(feature.name) ? 'bg-purple-500 border-purple-600 shadow-sm' : 'bg-white border-gray-200'}`}>
                                        {checkedFeatures.has(feature.name) ? <CheckCircle2 className="h-3 w-3 text-white" /> : <Circle className="h-3 w-3 text-gray-100" />}
                                    </div>
                                    <span className={`text-sm font-bold ${checkedFeatures.has(feature.name) ? 'text-purple-700' : 'text-gray-700'}`} style={{ fontFamily: '"Caveat", cursive', fontSize: '1.3rem' }}>
                                        {feature.name}
                                    </span>
                                </div>
                            ))}
                            {(event.features || []).length === 0 && (
                                <p className="col-span-2 text-center text-sm text-gray-400 italic py-4">No features added in Basic Info.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Host Messages (Simplified as per redesign) */}
            <div className="bg-white border-2 border-gray-800 p-8 shadow-[4px_4px_0px_#333] relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-100 border-2 border-dashed border-yellow-200 rounded-full flex items-center justify-center text-4xl rotate-12 opacity-50">
                    💬
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="h-6 w-6 text-gray-800" />
                    <h3 className="text-xl font-bold" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                        Messages from Host
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Live Notification Chat</p>
                        <div className="h-32 flex items-center justify-center border-2 border-gray-100 bg-white rounded shadow-inner">
                            <p className="text-xs text-gray-300 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}>Ready for live chat placeholder...</p>
                        </div>
                    </div>
                    <div className="p-5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Host Noticeboard</p>
                        <div className="h-32 flex items-center justify-center border-2 border-gray-100 bg-white rounded shadow-inner">
                            <p className="text-xs text-gray-300 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}>Share updates with all vendors...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
